resource "aws_dynamodb_table" "notarisations" {
  name         = "nottario-notarisations-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transactionId"

  attribute {
    name = "transactionId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "audit_log" {
  name         = "nottario-audit-log-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transactionId"
  range_key    = "sortKey"

  attribute {
    name = "transactionId"
    type = "S"
  }

  attribute {
    name = "sortKey"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# Secrets — values are set manually after first apply, never in Terraform state
resource "aws_secretsmanager_secret" "stripe" {
  name                    = "nottario/${var.environment}/stripe"
  description             = "Stripe API keys"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret" "tsa" {
  name                    = "nottario/${var.environment}/tsa"
  description             = "DigiCert TSA credentials"
  recovery_window_in_days = 7
}
