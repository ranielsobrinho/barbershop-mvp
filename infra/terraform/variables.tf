variable "database_password" {
  description = "Master password for the private demo PostgreSQL instance. Supply through a local tfvars file or TF_VAR_database_password."
  type        = string
  sensitive   = true
  nullable    = false

  validation {
    condition     = length(var.database_password) >= 16 && !can(regex("[/@\" ]", var.database_password))
    error_message = "The database password must contain at least 16 characters and cannot contain slash, at sign, quote, or spaces."
  }
}

variable "deploy_application" {
  description = "Create ECS task definitions and services after the image has been pushed to ECR and application secrets are configured."
  type        = bool
  default     = false
}

variable "image_tag" {
  description = "Immutable image tag already pushed to the application ECR repository."
  type        = string
  default     = "demo"

  validation {
    condition     = length(trimspace(var.image_tag)) > 0
    error_message = "image_tag cannot be empty."
  }
}

variable "cookie_secure" {
  description = "Set true when the public entry point uses HTTPS. Keep false only for the HTTP-only Floci demo."
  type        = bool
  default     = false
}

variable "jwt_secret" {
  description = "Production JWT signing secret. Required when deploy_application is true."
  type        = string
  sensitive   = true
  default     = ""

  validation {
    condition     = !var.deploy_application || length(var.jwt_secret) >= 32
    error_message = "Set jwt_secret to at least 32 characters before deploying the application."
  }
}

variable "cookie_secret" {
  description = "Production cookie signing secret. Required when deploy_application is true."
  type        = string
  sensitive   = true
  default     = ""

  validation {
    condition     = !var.deploy_application || length(var.cookie_secret) >= 32
    error_message = "Set cookie_secret to at least 32 characters before deploying the application."
  }
}

variable "whatsapp_internal_secret" {
  description = "Optional shared secret for internal WhatsApp endpoints. Leave empty when WhatsApp is disabled."
  type        = string
  sensitive   = true
  default     = ""
}

variable "whatsapp_encryption_key" {
  description = "Optional 64-character hexadecimal key for WhatsApp credentials. Leave empty when WhatsApp is disabled."
  type        = string
  sensitive   = true
  default     = ""

  validation {
    condition = (var.whatsapp_internal_secret == "" && var.whatsapp_encryption_key == "") || (
      length(var.whatsapp_internal_secret) >= 32 && can(regex("^[a-fA-F0-9]{64}$", var.whatsapp_encryption_key))
    )
    error_message = "When enabling WhatsApp secrets, set an internal secret of at least 32 characters and a 64-character hexadecimal encryption key."
  }
}
