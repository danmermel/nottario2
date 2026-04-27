output "url_create_checkout" {
  description = "Lambda Function URL — createCheckout"
  value       = module.api.url_create_checkout
}

output "url_stripe_webhook" {
  description = "Lambda Function URL — stripeWebhook (register this in Stripe dashboard)"
  value       = module.api.url_stripe_webhook
}

output "url_notarise" {
  description = "Lambda Function URL — notarise"
  value       = module.api.url_notarise
}

output "url_generate_receipt" {
  description = "Lambda Function URL — generateReceipt"
  value       = module.api.url_generate_receipt
}

output "url_verify" {
  description = "Lambda Function URL — verify"
  value       = module.api.url_verify
}
