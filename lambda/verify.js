import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBClient as DDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { randomUUID } from 'crypto'

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'eu-west-1' })

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function writeAuditLog({ transactionId, action, detail }) {
  const sortKey = `${new Date().toISOString()}#${randomUUID()}`
  try {
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
  } catch (err) {
    // Audit log failure should never block a verification response
    console.warn('Audit log write failed:', err.message)
  }
}

export const handler = async (event) => {
  let body
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return response(400, { message: 'Invalid request body.' })
  }

  const { hash, transactionId } = body

  // Validate hash — must be a 64-char hex string (SHA-256)
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    return response(400, { message: 'Invalid or missing document hash.' })
  }

  // Validate transaction ID — basic length check
  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length < 8) {
    return response(400, { message: 'Invalid or missing transaction ID.' })
  }

  const txId = transactionId.trim()

  // Look up the notarisation record
  let item
  try {
    const res = await dynamodb.send(new GetItemCommand({
      TableName: process.env.NOTARISATIONS_TABLE_NAME,
      Key: { transactionId: { S: txId } },
    }))
    item = res.Item
  } catch (err) {
    console.error('DynamoDB lookup failed:', err)
    return response(500, { message: 'Failed to look up notarisation record.' })
  }

  // Transaction ID not found
  if (!item) {
    await writeAuditLog({
      transactionId: txId,
      action: 'VERIFY_NOT_FOUND',
      detail: `Submitted hash: ${hash}`,
    })
    return response(200, {
      found: false,
      match: false,
    })
  }

  const storedHash = item.hash.S
  const match      = storedHash === hash

  await writeAuditLog({
    transactionId: txId,
    action: match ? 'VERIFY_MATCH' : 'VERIFY_MISMATCH',
    detail: match
      ? 'Hash matched'
      : `Stored: ${storedHash} · Submitted: ${hash}`,
  })

  // Return the stored record details alongside the match result
  // The frontend uses these to populate the verification result card
  return response(200, {
    found:         true,
    match,
    transactionId: txId,
    timestamp:     item.timestamp.S,
    storedHash,

    // Only include the submitted hash on mismatch so the frontend
    // can show a side-by-side comparison — unnecessary on a match
    ...(match ? {} : { submittedHash: hash }),
  })
}
