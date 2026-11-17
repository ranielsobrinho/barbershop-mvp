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

output "migration_task_definition_arn" {
  description = "One-shot ECS task definition for applying Prisma migrations. Empty when deploy_application is false."
  value       = var.deploy_application ? aws_ecs_task_definition.migration[0].arn : null
}

output "private_subnet_ids" {
  description = "Private subnets for ECS tasks, including the one-shot migration task."
  value       = aws_subnet.private[*].id
}

output "backend_security_group_id" {
  description = "Security group for backend ECS tasks and the migration task's PostgreSQL access."
  value       = aws_security_group.backend.id
}

output "database_endpoint" {
  description = "Private PostgreSQL endpoint."
  value       = aws_db_instance.showcase.endpoint
}

output "private_service_namespace" {
  description = "Private Cloud Map namespace for backend service discovery."
  value       = aws_service_discovery_private_dns_namespace.showcase.name
}
