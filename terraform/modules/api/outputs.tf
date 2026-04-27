output "url_create_checkout" {
  value = aws_lambda_function_url.functions["createCheckout"].function_url
}

output "url_stripe_webhook" {
  value = aws_lambda_function_url.functions["stripeWebhook"].function_url
}

output "url_notarise" {
  value = aws_lambda_function_url.functions["notarise"].function_url
}

output "url_generate_receipt" {
  value = aws_lambda_function_url.functions["generateReceipt"].function_url
}

output "url_verify" {
  value = aws_lambda_function_url.functions["verify"].function_url
}
