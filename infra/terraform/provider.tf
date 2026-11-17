provider "aws" {
  region     = var.aws_region
  access_key = var.use_floci ? "test" : null
  secret_key = var.use_floci ? "test" : null

  skip_credentials_validation = var.use_floci
  skip_metadata_api_check     = var.use_floci
  skip_requesting_account_id  = var.use_floci

  endpoints {
    cloudfront       = var.use_floci ? var.floci_endpoint : null
    cloudwatchlogs   = var.use_floci ? var.floci_endpoint : null
    ec2              = var.use_floci ? var.floci_endpoint : null
    ecr              = var.use_floci ? var.floci_endpoint : null
    ecs              = var.use_floci ? var.floci_endpoint : null
    elbv2            = var.use_floci ? var.floci_endpoint : null
    iam              = var.use_floci ? var.floci_endpoint : null
    rds              = var.use_floci ? var.floci_endpoint : null
    secretsmanager   = var.use_floci ? var.floci_endpoint : null
    servicediscovery = var.use_floci ? var.floci_endpoint : null
  }
}
