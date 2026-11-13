output "public_demo_url" {
  description = "HTTP URL for the local Floci load balancer. Configure HTTPS before an AWS deployment."
  value       = "http://${aws_lb.showcase.dns_name}"
}

output "ecr_repository_url" {
  description = "Container image repository for the application."
  value       = aws_ecr_repository.application.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster for independently deployed application services."
  value       = aws_ecs_cluster.showcase.name
}

output "database_endpoint" {
  description = "Private PostgreSQL endpoint."
  value       = aws_db_instance.showcase.endpoint
}

output "private_service_namespace" {
  description = "Private Cloud Map namespace for backend service discovery."
  value       = aws_service_discovery_private_dns_namespace.showcase.name
}
