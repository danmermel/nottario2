import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import Stripe from 'stripe'

const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION ?? 'eu-west-1' })

// Cache the Stripe client across warm invocations
let stripe = null

async function getStripe() {
  if (stripe) return stripe

  const res = await secrets.send(new GetSecretValueCommand({
    SecretId: process.env.STRIPE_SECRET_ARN,
  }))
  const { secretKey } = JSON.parse(res.SecretString)
  stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' })
  return stripe
}

function response(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  }
}

export const handler = async (event) => {
  // Lambda Function URLs always deliver a JSON string body
  let body
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return response(400, { message: 'Invalid request body.' })
  }

  const { hash, fileName } = body

  // Validate hash — must be a 64-char hex string (SHA-256)
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    return response(400, { message: 'Invalid or missing document hash.' })
  }

  if (!fileName || typeof fileName !== 'string') {
    return response(400, { message: 'Missing file name.' })
  }

  const domain = process.env.DOMAIN_NAME
  if (!domain) {
    return response(500, { message: 'Server misconfiguration: DOMAIN_NAME not set.' })
  }

  try {
    const client = await getStripe()

    const session = await client.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: 499, // £4.99 in pence
            product_data: {
              name: 'Document notarisation',
              description: `Cryptographic timestamp for: ${fileName}`,
            },
          },
          quantity: 1,
        },
      ],

      // The hash travels through Stripe as metadata and comes back
      // in the webhook — this is how we tie payment to notarisation
      metadata: {
        hash,
        fileName: fileName.slice(0, 500), // Stripe metadata values max 500 chars
      },

      // After payment, Stripe redirects here with ?session_id=
      success_url: `https://${domain}/notarise?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `https://${domain}/notarise`,

      // Receipt email from Stripe (optional — remove if you prefer no emails)
      invoice_creation: { enabled: false },
    })

    return response(200, {
      url:       session.url,
      sessionId: session.id,
    })

  } catch (err) {
    console.error('Stripe session creation failed:', err)
    return response(502, { message: 'Failed to create payment session. Please try again.' })
  }
}
