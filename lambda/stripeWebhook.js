import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import Stripe from 'stripe'

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION ?? 'eu-west-1' })
const lambdaClient  = new LambdaClient({ region: process.env.AWS_REGION ?? 'eu-west-1' })

// Cached across warm invocations
let stripe          = null
let webhookSecret   = null

async function getStripeAndSecret() {
  if (stripe && webhookSecret) return { stripe, webhookSecret }

  const res = await secretsClient.send(new GetSecretValueCommand({
    SecretId: process.env.STRIPE_SECRET_ARN,
  }))
  const parsed = JSON.parse(res.SecretString)

  stripe        = new Stripe(parsed.secretKey, { apiVersion: '2024-04-10' })
  webhookSecret = parsed.webhookSecret
  return { stripe, webhookSecret }
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export const handler = async (event) => {
  // Lambda Function URLs base64-encode the body when the content
  // type is not text — we need the raw bytes for signature verification
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body

  const signature = event.headers?.['stripe-signature']

  if (!signature) {
    console.warn('Missing stripe-signature header')
    return response(400, { message: 'Missing stripe-signature header.' })
  }

  let stripeEvent
  try {
    const { stripe: client, webhookSecret: secret } = await getStripeAndSecret()

    // This throws if the signature is invalid or the timestamp is stale
    // (Stripe includes a timestamp in the signature to prevent replay attacks)
    stripeEvent = client.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.warn('Webhook signature verification failed:', err.message)
    return response(400, { message: 'Webhook signature verification failed.' })
  }

  // We only care about successful payments — ignore everything else
  // Return 200 so Stripe doesn't keep retrying unhandled event types
  if (stripeEvent.type !== 'checkout.session.completed') {
    return response(200, { received: true })
  }

  const session = stripeEvent.data.object

  // Validate the metadata we stored in createCheckout
  const { hash, fileName } = session.metadata ?? {}

  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    // This should never happen — log it for investigation
    console.error('Session missing valid hash in metadata:', session.id)
    return response(200, { received: true })
  }

  // Guard against duplicate webhook deliveries — Stripe guarantees
  // at-least-once delivery, so the same event can arrive more than once.
  // The notarise Lambda handles idempotency using the session ID as a
  // condition on the DynamoDB write, so duplicates are safe to invoke.

  try {
    // Invoke notarise asynchronously (InvocationType: Event = fire and forget)
    // This lets us return 200 to Stripe immediately without waiting for the
    // TSA call and DynamoDB write to complete.
    await lambdaClient.send(new InvokeCommand({
      FunctionName:   process.env.NOTARISE_FUNCTION_NAME,
      InvocationType: 'Event', // async — no response body
      Payload: JSON.stringify({
        sessionId: session.id,
        hash,
        fileName: fileName ?? 'unknown',
        amountTotal:  session.amount_total,
        currency:     session.currency,
      }),
    }))
  } catch (err) {
    // If the async invoke fails, log it — Stripe will retry the webhook
    console.error('Failed to invoke notarise Lambda:', err)
    return response(500, { message: 'Internal error — will retry.' })
  }

  console.log(`Payment confirmed, notarisation triggered for session ${session.id}`)
  return response(200, { received: true })
}
