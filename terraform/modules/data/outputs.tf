output "notarisations_table_name" {
  value = aws_dynamodb_table.notarisations.name
}

output "notarisations_table_arn" {
  value = aws_dynamodb_table.notarisations.arn
}

output "audit_log_table_name" {
  value = aws_dynamodb_table.audit_log.name
}

output "audit_log_table_arn" {
  value = aws_dynamodb_table.audit_log.arn
}

output "stripe_secret_arn" {
  value = aws_secretsmanager_secret.stripe.arn
}

output "tsa_secret_arn" {
  value = aws_secretsmanager_secret.tsa.arn
}
