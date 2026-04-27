variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Frontend domain e.g. nottario.com (used for CORS)"
  type        = string
}
