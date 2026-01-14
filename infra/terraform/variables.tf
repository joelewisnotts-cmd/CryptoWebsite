variable "aws_region" {
  type        = string
  description = "AWS region to deploy into"
  default     = "eu-west-2"
}

variable "project_name" {
  type        = string
  description = "Prefix used for naming"
  default     = "crypto-website"
}

variable "site_dir" {
  type        = string
  description = "Path to your static website files (relative to infra/terraform)"
  default     = "../.."
}

