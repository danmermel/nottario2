terraform {
  required_version = ">= 1.14.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.37"
    }
  }

  backend "s3" {
    bucket  = "danmermel-terraform-state"
    key     = "nottario2/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "nottario"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "data" {
  source      = "./modules/data"
  environment = var.environment
}

module "api" {
  source      = "./modules/api"
  environment = var.environment
  domain_name = var.domain_name

  notarisations_table_name = module.data.notarisations_table_name
  notarisations_table_arn  = module.data.notarisations_table_arn
  audit_log_table_name     = module.data.audit_log_table_name
  audit_log_table_arn      = module.data.audit_log_table_arn
  stripe_secret_arn        = module.data.stripe_secret_arn
  tsa_secret_arn           = module.data.tsa_secret_arn
}
