locals {
  functions = {
    createCheckout = {
      handler = "createCheckout.handler"
      memory  = 256
      timeout = 10
    }
    stripeWebhook = {
      handler = "stripeWebhook.handler"
      memory  = 256
      timeout = 15
    }
    notarise = {
      handler = "notarise.handler"
      memory  = 512
      timeout = 30
    }
    generateReceipt = {
      handler = "generateReceipt.handler"
      memory  = 512
      timeout = 15
    }
    verify = {
      handler = "verify.handler"
      memory  = 256
      timeout = 10
    }
  }

  # Per-function extra environment variables — merged with shared vars below.
  # NOTE: RECEIPT_FUNCTION_URL is NOT set here to avoid a dependency cycle
  # (function env vars -> Function URL -> Lambda function -> function env vars).
  # It is instead set via a separate aws_lambda_function resource update
  # using a null_resource trigger after all Function URLs are known.
  # See the aws_lambda_function_environment patch at the bottom of this file.
  function_extra_env = {
    createCheckout  = {}
    stripeWebhook   = {
      NOTARISE_FUNCTION_NAME = "nottario-notarise-${var.environment}"
    }
    notarise        = {}
    generateReceipt = {}
    verify          = {}
  }

  # CORS allowed origins — production domains + localhost for dev
  cors_origins = concat(
    [
      "https://${var.domain_name}",
      "https://www.${var.domain_name}",
      "http://localhost:3000"
    ],
    var.environment != "prod" ? ["http://localhost:3000"] : []
  )
}

# ── IAM ──────────────────────────────────────────────────────────────

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "nottario-lambda-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name = "nottario-lambda-permissions-${var.environment}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDB"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
        ]
        Resource = [
          var.notarisations_table_arn,
          var.audit_log_table_arn,
          "${var.notarisations_table_arn}/index/*",
        ]
      },
      {
        Sid      = "SecretsManager"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [var.stripe_secret_arn, var.tsa_secret_arn]
      },
      {
        Sid    = "SSMParameters"
        Effect = "Allow"
        Action = ["ssm:GetParameter"]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/nottario/${var.environment}/*"
      },
      {
        Sid    = "InvokeNotarise"
        Effect = "Allow"
        Action = ["lambda:InvokeFunction"]
        # stripeWebhook needs to invoke notarise asynchronously
        Resource = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:nottario-notarise-${var.environment}"
      }
    ]
  })
}

# Required for constructing the notarise function ARN in the IAM policy above
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# ── Lambda functions ──────────────────────────────────────────────────

resource "aws_lambda_function" "functions" {
  for_each = local.functions

  function_name = "nottario-${each.key}-${var.environment}"
  role          = aws_iam_role.lambda.arn
  handler       = each.value.handler
  runtime       = "nodejs20.x"
  memory_size   = each.value.memory
  timeout       = each.value.timeout
  filename      = "${path.module}/../../../lambda/dist/${each.key}.zip"

  source_code_hash = filebase64sha256("${path.module}/../../../lambda/dist/${each.key}.zip")

  environment {
    variables = merge(
      # Shared across all functions
      {
        ENVIRONMENT              = var.environment
        NOTARISATIONS_TABLE_NAME = var.notarisations_table_name
        AUDIT_LOG_TABLE_NAME     = var.audit_log_table_name
        STRIPE_SECRET_ARN        = var.stripe_secret_arn
        TSA_SECRET_ARN           = var.tsa_secret_arn
        DOMAIN_NAME              = var.domain_name
      },
      # Per-function extras
      local.function_extra_env[each.key]
    )
  }
}

# ── Lambda Function URLs ──────────────────────────────────────────────

resource "aws_lambda_function_url" "functions" {
  for_each = local.functions

  function_name      = aws_lambda_function.functions[each.key].function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = local.cors_origins
    allow_methods     = ["POST", "GET"]
    allow_headers     = ["content-type", "stripe-signature"]
    max_age           = 300
  }
}

# ── SSM Parameter Store — Function URLs for GitHub Actions ────────────
# Written here so the frontend build job can read them without
# depending on terraform output in the workflow.

resource "aws_ssm_parameter" "function_urls" {
  for_each = local.functions

  name  = "/nottario/${var.environment}/url_${each.key}"
  type  = "String"
  value = aws_lambda_function_url.functions[each.key].function_url
}

# ── CloudWatch log groups ─────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "functions" {
  for_each = local.functions

  name              = "/aws/lambda/nottario-${each.key}-${var.environment}"
  retention_in_days = 30
}

# ── Patch notarise env with RECEIPT_FUNCTION_URL after URLs are known ─
#
# We can't put RECEIPT_FUNCTION_URL in function_extra_env because it
# references aws_lambda_function_url which depends on aws_lambda_function
# which depends on function_extra_env — a cycle Terraform cannot resolve.
#
# The solution: update the notarise function's environment variables in a
# second pass using aws_lambda_function_event_invoke_config is not the right
# resource for env vars. Instead we use a separate aws_lambda_function resource
# override via a locals trick — but the cleanest Terraform-native approach is
# to accept that RECEIPT_FUNCTION_URL lives in SSM and the Lambda reads it
# at runtime rather than from env vars.
#
# We write it to SSM here (it's already written in aws_ssm_parameter.function_urls
# for the Function URLs), so we add one more SSM parameter for the receipt URL:

resource "aws_ssm_parameter" "receipt_function_url" {
  name  = "/nottario/${var.environment}/receipt_function_url"
  type  = "String"
  value = aws_lambda_function_url.functions["generateReceipt"].function_url
}
