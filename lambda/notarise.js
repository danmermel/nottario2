import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import Stripe from 'stripe'
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { createHash, randomUUID } from 'crypto'
import https from 'https'

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION ?? 'eu-west-1' })
const ssmClient     = new SSMClient({ region: process.env.AWS_REGION ?? 'eu-west-1' })

// Cached across warm invocations
let receiptFunctionUrl = null

async function getReceiptFunctionUrl() {
  if (receiptFunctionUrl) return receiptFunctionUrl
  const res = await ssmClient.send(new GetParameterCommand({
    Name: `/nottario/${process.env.ENVIRONMENT}/receipt_function_url`,
  }))
  receiptFunctionUrl = res.Parameter.Value
  return receiptFunctionUrl
}
const dynamodb      = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'eu-west-1' })

// Cached Stripe client
let stripe = null

async function getStripe() {
  if (stripe) return stripe
  const res = await secretsClient.send(new GetSecretValueCommand({
    SecretId: process.env.STRIPE_SECRET_ARN,
  }))
  const { secretKey } = JSON.parse(res.SecretString)
  stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' })
  return stripe
}

// Retrieve hash and fileName from the Stripe session metadata.
// This is necessary when notarise is called via HTTP from the frontend
// (completeAfterPayment) — only sessionId is available at that point.
async function getPayloadFromStripe(sessionId) {
  const client  = await getStripe()
  const session = await client.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== 'paid') {
    throw new Error(`Session ${sessionId} payment_status is '${session.payment_status}', not 'paid'`)
  }

  const { hash, fileName } = session.metadata ?? {}
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error(`Session ${sessionId} missing valid hash in metadata`)
  }

  return { hash, fileName: fileName ?? 'unknown' }
}

// Cached across warm invocations
let tsaConfig = null

async function getTsaConfig() {
  if (tsaConfig) return tsaConfig

  const res = await secretsClient.send(new GetSecretValueCommand({
    SecretId: process.env.TSA_SECRET_ARN,
  }))
  tsaConfig = JSON.parse(res.SecretString)
  return tsaConfig
}

// ── RFC 3161 timestamp request ────────────────────────────────────────
//
// A TSA request is a DER-encoded ASN.1 structure containing:
//   - the hash algorithm OID (SHA-256)
//   - the hash itself
//   - a nonce (random, prevents replay)
//   - certReq = true (ask TSA to include its certificate in the response)
//
// We build the minimal valid DER by hand to avoid a heavy ASN.1 library.
// This is a well-known fixed structure for SHA-256 TSA requests.

function buildTsaRequest(hashHex) {
  const hash = Buffer.from(hashHex, 'hex') // 32 bytes

  // SHA-256 OID: 2.16.840.1.101.3.4.2.1
  const sha256Oid = Buffer.from('300d06096086480165030402010500', 'hex')

  // MessageImprint ::= SEQUENCE { hashAlgorithm AlgorithmIdentifier, hashedMessage OCTET STRING }
  const hashOctet    = Buffer.concat([Buffer.from([0x04, 0x20]), hash])
  const msgImprint   = tlv(0x30, Buffer.concat([sha256Oid, hashOctet]))

  // Nonce — 8 random bytes as INTEGER
  const nonce        = randomUUID().replace(/-/g, '').slice(0, 16)
  const nonceBytes   = Buffer.from(nonce, 'hex')
  const nonceInt     = tlv(0x02, nonceBytes)

  // certReq BOOLEAN TRUE
  const certReq      = Buffer.from([0x01, 0x01, 0xff])

  // version INTEGER 1
  const version      = Buffer.from([0x02, 0x01, 0x01])

  // TimeStampReq ::= SEQUENCE { version, messageImprint, nonce, certReq }
  const tsaReq = tlv(0x30, Buffer.concat([version, msgImprint, nonceInt, certReq]))
  return tsaReq
}

function tlv(tag, value) {
  const len = value.length
  let lenBytes
  if (len < 128) {
    lenBytes = Buffer.from([len])
  } else if (len < 256) {
    lenBytes = Buffer.from([0x81, len])
  } else {
    lenBytes = Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff])
  }
  return Buffer.concat([Buffer.from([tag]), lenBytes, value])
}

// ── Send TSA request over HTTPS ───────────────────────────────────────

function sendTsaRequest(url, requestBody, username, password) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const auth      = username && password ? `${username}:${password}` : undefined

    const options = {
      hostname: parsedUrl.hostname,
      path:     parsedUrl.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/timestamp-query',
        'Content-Length': requestBody.length,
        ...(auth ? { Authorization: `Basic ${Buffer.from(auth).toString('base64')}` } : {}),
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          return reject(new Error(`TSA returned HTTP ${res.statusCode}`))
        }
        resolve(Buffer.concat(chunks))
      })
    })

    req.on('error', reject)
    req.setTimeout(20000, () => {
      req.destroy(new Error('TSA request timed out after 20s'))
    })
    req.write(requestBody)
    req.end()
  })
}

// ── DynamoDB helpers ──────────────────────────────────────────────────

async function getExistingRecord(sessionId) {
  const res = await dynamodb.send(new GetItemCommand({
    TableName: process.env.NOTARISATIONS_TABLE_NAME,
    Key: { transactionId: { S: sessionId } },
    ProjectionExpression: 'transactionId',
  }))
  return res.Item ?? null
}

async function writeNotarisation({ transactionId, hash, fileName, tsaToken, timestamp }) {
  // ConditionExpression prevents overwriting an existing record —
  // this is our idempotency guard against duplicate webhook deliveries
  await dynamodb.send(new PutItemCommand({
    TableName: process.env.NOTARISATIONS_TABLE_NAME,
    Item: {
      transactionId: { S: transactionId },
      hash:          { S: hash },
      fileName:      { S: fileName },
      tsaToken:      { S: tsaToken },       // base64-encoded DER response
      timestamp:     { S: timestamp },
      createdAt:     { S: new Date().toISOString() },
    },
    ConditionExpression: 'attribute_not_exists(transactionId)',
  }))
}

async function writeAuditLog({ transactionId, action, detail }) {
  const sortKey = `${new Date().toISOString()}#${randomUUID()}`
  await dynamodb.send(new PutItemCommand({
    TableName: process.env.AUDIT_LOG_TABLE_NAME,
    Item: {
      transactionId: { S: transactionId },
      sortKey:       { S: sortKey },
      action:        { S: action },
      detail:        { S: detail },
      timestamp:     { S: new Date().toISOString() },
    },
  }))
}

// ── Handler ───────────────────────────────────────────────────────────

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export const handler = async (event) => {
  // notarise can be invoked two ways:
  //   1. Async Lambda invoke from stripeWebhook — event is { sessionId, hash, fileName }
  //   2. HTTP POST via Function URL from the frontend — event has event.body as JSON string
  const isHttpInvocation = !!event.requestContext

  let payload
  if (isHttpInvocation) {
    try {
      payload = JSON.parse(event.body ?? '{}')
    } catch {
      return response(400, { message: 'Invalid request body.' })
    }
  } else {
    payload = event
  }

  let { sessionId, hash, fileName } = payload

  if (!sessionId) {
    console.error('notarise invoked with missing sessionId:', payload)
    if (isHttpInvocation) return response(400, { message: 'Missing sessionId.' })
    return
  }

  // When called from the frontend (completeAfterPayment), only sessionId is
  // available — hash and fileName must be retrieved from the Stripe session.
  // When called async from stripeWebhook, hash is already in the payload.
  if (!hash) {
    try {
      const fromStripe = await getPayloadFromStripe(sessionId)
      hash     = fromStripe.hash
      fileName = fromStripe.fileName
    } catch (err) {
      console.error('Failed to retrieve payload from Stripe:', err.message)
      if (isHttpInvocation) return response(402, { message: 'Payment not confirmed or session invalid.' })
      return
    }
  }

  // 1 — Idempotency check: skip if already notarised
  const existing = await getExistingRecord(sessionId)
  if (existing) {
    console.log(`Session ${sessionId} already notarised — skipping.`)
    if (isHttpInvocation) return response(200, { status: 'already_notarised', transactionId: sessionId })
    return
  }

  await writeAuditLog({ transactionId: sessionId, action: 'NOTARISE_STARTED', detail: hash })

  // 2 — Build and send the RFC 3161 timestamp request
  let tsaTokenBuffer
  try {
    const tsa     = await getTsaConfig()
    const request = buildTsaRequest(hash)
    tsaTokenBuffer = await sendTsaRequest(tsa.url, request, tsa.username, tsa.password)
    console.log(`TSA response received for session ${sessionId}, ${tsaTokenBuffer.length} bytes`)
  } catch (err) {
    console.error(`TSA request failed for session ${sessionId}:`, err)
    await writeAuditLog({ transactionId: sessionId, action: 'TSA_FAILED', detail: err.message })
    // Lambda will exit — no retry mechanism here since it was async-invoked.
    // Add a DLQ to the Lambda config in Terraform for failed async invocations.
    throw err
  }

  // 3 — Write to DynamoDB with idempotency condition
  const tsaToken  = tsaTokenBuffer.toString('base64')
  const timestamp = new Date().toISOString()

  try {
    await writeNotarisation({
      transactionId: sessionId,
      hash,
      fileName: fileName ?? 'unknown',
      tsaToken,
      timestamp,
    })
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Another invocation already wrote this record — safe to ignore
      console.log(`Race condition handled for session ${sessionId} — already written.`)
      return
    }
    console.error(`DynamoDB write failed for session ${sessionId}:`, err)
    await writeAuditLog({ transactionId: sessionId, action: 'DYNAMO_FAILED', detail: err.message })
    throw err
  }

  await writeAuditLog({ transactionId: sessionId, action: 'NOTARISE_COMPLETE', detail: timestamp })
  console.log(`Notarisation complete for session ${sessionId} at ${timestamp}`)

  if (isHttpInvocation) {
    return response(200, {
      transactionId: sessionId,
      hash,
      timestamp,
      receiptUrl: `${await getReceiptFunctionUrl()}?txId=${sessionId}`,
    })
  }
}