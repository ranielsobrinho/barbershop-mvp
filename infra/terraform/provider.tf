provider "aws" {
  region     = "us-east-1"
  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    cloudfront       = "http://127.0.0.1:4566"
    cloudwatchlogs   = "http://127.0.0.1:4566"
    ec2              = "http://127.0.0.1:4566"
    ecr              = "http://127.0.0.1:4566"
    ecs              = "http://127.0.0.1:4566"
    elbv2            = "http://127.0.0.1:4566"
    iam              = "http://127.0.0.1:4566"
    rds              = "http://127.0.0.1:4566"
    secretsmanager   = "http://127.0.0.1:4566"
    servicediscovery = "http://127.0.0.1:4566"
  }
}
