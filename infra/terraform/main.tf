data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  availability_zones = slice(
    data.aws_availability_zones.available.names,
    0,
    2
  )

  service_specs = {
    web = {
      port           = 8080
      security_group = "web"
      discovery      = false
      command        = ["node", "server.mjs", "--port", "8080", "--gateway", "http://gateway.showcase.internal:3000"]
      port_mappings  = [{ containerPort = 8080, protocol = "tcp" }]
      environment    = { NODE_ENV = "production", PORT = "8080", GATEWAY_URL = "http://gateway.showcase.internal:3000" }
      secrets        = []
    }
    gateway = {
      port           = 3000
      security_group = "gateway"
      discovery      = true
      command        = ["pnpm", "--filter", "@barbershop/api-gateway", "start"]
      port_mappings  = [{ containerPort = 3000, protocol = "tcp" }]
      environment = {
        NODE_ENV                   = "production"
        PORT                       = "3000"
        AUTH_SERVICE_URL           = "http://auth.showcase.internal:3001"
        SCHEDULING_SERVICE_URL     = "http://scheduling.showcase.internal:3002"
        SERVICES_SERVICE_URL       = "http://services.showcase.internal:3003"
        BLOCKS_SERVICE_URL         = "http://blocks.showcase.internal:3004"
        BUSINESS_HOURS_SERVICE_URL = "http://business-hours.showcase.internal:3005"
        SETTINGS_SERVICE_URL       = "http://settings.showcase.internal:3006"
        FRONTEND_URL               = "http://${aws_lb.showcase.dns_name}"
      }
      secrets = [
        { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt.arn },
        { name = "COOKIE_SECRET", valueFrom = aws_secretsmanager_secret.cookie.arn }
      ]
    }
    auth = {
      port           = 3001
      security_group = "backend"
      discovery      = true
      command        = ["pnpm", "--filter", "@barbershop/auth-service", "start"]
      port_mappings  = [{ containerPort = 3001, protocol = "tcp" }, { containerPort = 5001, protocol = "tcp" }]
      environment    = { NODE_ENV = "production", PORT = "3001", GRPC_PORT = "5001", COOKIE_SECURE = tostring(var.cookie_secure) }
      secrets        = local.backend_secrets
    }
    scheduling = {
      port           = 3002
      security_group = "backend"
      discovery      = true
      command        = ["pnpm", "--filter", "@barbershop/scheduling-service", "start"]
      port_mappings  = [{ containerPort = 3002, protocol = "tcp" }, { containerPort = 5002, protocol = "tcp" }]
      environment = {
        NODE_ENV                    = "production"
        PORT                        = "3002"
        GRPC_PORT                   = "5002"
        SETTINGS_SERVICE_URL        = "http://settings.showcase.internal:3006"
        AUTH_SERVICE_GRPC           = "auth.showcase.internal:5001"
        SERVICES_SERVICE_GRPC       = "services.showcase.internal:5003"
        BLOCKS_SERVICE_GRPC         = "blocks.showcase.internal:5004"
        BUSINESS_HOURS_SERVICE_GRPC = "business-hours.showcase.internal:5005"
      }
      secrets = concat(local.backend_secrets, local.whatsapp_internal_secrets)
    }
    services = {
      port           = 3003
      security_group = "backend"
      discovery      = true
      command        = ["pnpm", "--filter", "@barbershop/services-service", "start"]
      port_mappings  = [{ containerPort = 3003, protocol = "tcp" }, { containerPort = 5003, protocol = "tcp" }]
      environment    = { NODE_ENV = "production", PORT = "3003", GRPC_PORT = "5003", AUTH_SERVICE_GRPC = "auth.showcase.internal:5001" }
      secrets        = local.backend_secrets
    }
    blocks = {
      port           = 3004
      security_group = "backend"
      discovery      = true
      command        = ["pnpm", "--filter", "@barbershop/blocks-service", "start"]
      port_mappings  = [{ containerPort = 3004, protocol = "tcp" }]
      environment    = { NODE_ENV = "production", PORT = "3004", AUTH_SERVICE_GRPC = "auth.showcase.internal:5001" }
      secrets        = local.backend_secrets
    }
    business-hours = {
      port           = 3005
      security_group = "backend"
      discovery      = true
      command        = ["pnpm", "--filter", "@barbershop/business-hours-service", "start"]
      port_mappings  = [{ containerPort = 3005, protocol = "tcp" }]
      environment    = { NODE_ENV = "production", PORT = "3005", AUTH_SERVICE_GRPC = "auth.showcase.internal:5001" }
      secrets        = local.backend_secrets
    }
    settings = {
      port           = 3006
      security_group = "backend"
      discovery      = true
      command        = ["pnpm", "--filter", "@barbershop/settings-service", "start"]
      port_mappings  = [{ containerPort = 3006, protocol = "tcp" }]
      environment    = { NODE_ENV = "production", PORT = "3006", AUTH_SERVICE_GRPC = "auth.showcase.internal:5001" }
      secrets        = concat(local.backend_secrets, local.whatsapp_internal_secrets, local.whatsapp_encryption_secrets)
    }
  }

  backend_secrets = [
    { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.database_url.arn },
    { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt.arn },
    { name = "COOKIE_SECRET", valueFrom = aws_secretsmanager_secret.cookie.arn }
  ]

  whatsapp_internal_secrets = var.whatsapp_internal_secret == "" ? [] : [
    { name = "WHATSAPP_INTERNAL_SECRET", valueFrom = aws_secretsmanager_secret.whatsapp_internal.arn }
  ]

  whatsapp_encryption_secrets = var.whatsapp_encryption_key == "" ? [] : [
    { name = "WHATSAPP_ENCRYPTION_KEY", valueFrom = aws_secretsmanager_secret.whatsapp_encryption.arn }
  ]
}

resource "aws_vpc" "showcase" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "seu-carlos-barbearia-showcase-vpc"
  }
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.showcase.id
  cidr_block              = cidrsubnet(aws_vpc.showcase.cidr_block, 8, count.index)
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "seu-carlos-barbearia-showcase-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.showcase.id
  cidr_block        = cidrsubnet(aws_vpc.showcase.cidr_block, 8, count.index + 10)
  availability_zone = local.availability_zones[count.index]

  tags = {
    Name = "seu-carlos-barbearia-showcase-private-${count.index + 1}"
  }
}

resource "aws_internet_gateway" "showcase" {
  vpc_id = aws_vpc.showcase.id

  tags = {
    Name = "seu-carlos-barbearia-showcase-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.showcase.id

  tags = {
    Name = "seu-carlos-barbearia-showcase-public"
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.showcase.id
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "seu-carlos-barbearia-showcase-nat"
  }
}

resource "aws_nat_gateway" "showcase" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  depends_on = [
    aws_route.public_internet,
    aws_route_table_association.public
  ]

  tags = {
    Name = "seu-carlos-barbearia-showcase-nat"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.showcase.id

  tags = {
    Name = "seu-carlos-barbearia-showcase-private"
  }
}

resource "aws_route" "private_egress" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.showcase.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "alb" {
  name        = "seu-carlos-barbearia-showcase-alb"
  description = "Security group for the public load balancer"
  vpc_id      = aws_vpc.showcase.id

  tags = {
    Name = "seu-carlos-barbearia-showcase-alb"
  }
}

resource "aws_security_group" "web" {
  name        = "seu-carlos-barbearia-showcase-web"
  description = "Security group for the web container"
  vpc_id      = aws_vpc.showcase.id

  tags = {
    Name = "seu-carlos-barbearia-showcase-web"
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  description       = "HTTP from floci test clients"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_web" {
  security_group_id            = aws_security_group.alb.id
  referenced_security_group_id = aws_security_group.web.id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
  description                  = "Forward traffic to the container"

  # Floci prefixes same-account security group IDs with its account ID on reads.
  # Remove this workaround when switching this configuration to AWS.
  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_ingress_rule" "web_from_alb" {
  security_group_id            = aws_security_group.web.id
  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
  description                  = "Accept traffic only from the load balancer"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_security_group" "gateway" {
  name        = "seu-carlos-barbearia-showcase-gateway"
  description = "Security group for the API gateway"
  vpc_id      = aws_vpc.showcase.id

  tags = {
    Name = "seu-carlos-barbearia-showcase-gateway"
  }
}

resource "aws_vpc_security_group_egress_rule" "web_to_gateway" {
  security_group_id            = aws_security_group.web.id
  referenced_security_group_id = aws_security_group.gateway.id
  from_port                    = 3000
  to_port                      = 3000
  ip_protocol                  = "tcp"
  description                  = "Allow web requests to the API gateway"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_ingress_rule" "gateway_from_web" {
  security_group_id            = aws_security_group.gateway.id
  referenced_security_group_id = aws_security_group.web.id
  from_port                    = 3000
  to_port                      = 3000
  ip_protocol                  = "tcp"
  description                  = "Accept API requests from the web container"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_security_group" "backend" {
  name        = "seu-carlos-barbearia-showcase-backend"
  description = "Security group for backend services"
  vpc_id      = aws_vpc.showcase.id

  tags = {
    Name = "seu-carlos-barbearia-showcase-backend"
  }
}

resource "aws_vpc_security_group_egress_rule" "gateway_to_backend" {
  security_group_id            = aws_security_group.gateway.id
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = 3001
  to_port                      = 3006
  ip_protocol                  = "tcp"
  description                  = "Gateway to backend HTTP services"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_ingress_rule" "backend_from_gateway" {
  security_group_id            = aws_security_group.backend.id
  referenced_security_group_id = aws_security_group.gateway.id
  from_port                    = 3001
  to_port                      = 3006
  ip_protocol                  = "tcp"
  description                  = "Accept HTTP requests from the gateway"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_egress_rule" "backend_internal_http" {
  security_group_id            = aws_security_group.backend.id
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = 3001
  to_port                      = 3006
  ip_protocol                  = "tcp"
  description                  = "Backend-to-backend HTTP calls"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_ingress_rule" "backend_internal_http" {
  security_group_id            = aws_security_group.backend.id
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = 3001
  to_port                      = 3006
  ip_protocol                  = "tcp"
  description                  = "Accept backend-to-backend HTTP calls"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_egress_rule" "backend_internal_grpc" {
  security_group_id            = aws_security_group.backend.id
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = 5001
  to_port                      = 5005
  ip_protocol                  = "tcp"
  description                  = "Backend gRPC calls"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_ingress_rule" "backend_internal_grpc" {
  security_group_id            = aws_security_group.backend.id
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = 5001
  to_port                      = 5005
  ip_protocol                  = "tcp"
  description                  = "Accept backend gRPC calls"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_egress_rule" "web_https" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS egress via NAT"
}

resource "aws_vpc_security_group_egress_rule" "gateway_https" {
  security_group_id = aws_security_group.gateway.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS egress via NAT"
}

resource "aws_vpc_security_group_egress_rule" "backend_https" {
  security_group_id = aws_security_group.backend.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS egress via NAT"
}

resource "aws_security_group" "database" {
  name        = "seu-carlos-barbearia-showcase-database"
  description = "Security group for PostgreSQL"
  vpc_id      = aws_vpc.showcase.id

  tags = {
    Name = "seu-carlos-barbearia-showcase-database"
  }
}

resource "aws_vpc_security_group_egress_rule" "backend_to_database" {
  security_group_id            = aws_security_group.backend.id
  referenced_security_group_id = aws_security_group.database.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Backend services to PostgreSQL"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_vpc_security_group_ingress_rule" "database_from_backend" {
  security_group_id            = aws_security_group.database.id
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Accept PostgreSQL connections from backends"

  lifecycle {
    ignore_changes = [referenced_security_group_id]
  }
}

resource "aws_lb" "showcase" {
  name               = "seu-carlos-showcase"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "seu-carlos-barbearia-showcase-alb"
  }
}

resource "aws_lb_target_group" "web" {
  name        = "seu-carlos-web"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.showcase.id

  health_check {
    enabled             = true
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.showcase.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_ecs_cluster" "showcase" {
  name = "seu-carlos-barbearia-showcase"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecr_repository" "application" {
  name                 = "seu-carlos-barbearia-showcase"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_service_discovery_private_dns_namespace" "showcase" {
  name        = "showcase.internal"
  description = "Private service discovery for the Seu Carlos demo"
  vpc         = aws_vpc.showcase.id
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "seu-carlos-showcase-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_cloudwatch_log_group" "application" {
  for_each          = toset(["web", "gateway", "auth", "scheduling", "services", "blocks", "business-hours", "settings", "migration"])
  name              = "/ecs/seu-carlos-showcase/${each.key}"
  retention_in_days = 14
}

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "seu-carlos-showcase/database-url"
  description             = "Database connection URL for the demo services"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "jwt" {
  name                    = "seu-carlos-showcase/jwt-secret"
  description             = "JWT signing secret for the demo services"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "cookie" {
  name                    = "seu-carlos-showcase/cookie-secret"
  description             = "Cookie signing secret for the demo services"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "whatsapp_internal" {
  name                    = "seu-carlos-showcase/whatsapp-internal-secret"
  description             = "Internal authorization token for optional WhatsApp routes"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "whatsapp_encryption" {
  name                    = "seu-carlos-showcase/whatsapp-encryption-key"
  description             = "Encryption key for optional WhatsApp provider credentials"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "jwt" {
  count         = var.deploy_application ? 1 : 0
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret_version" "cookie" {
  count         = var.deploy_application ? 1 : 0
  secret_id     = aws_secretsmanager_secret.cookie.id
  secret_string = var.cookie_secret
}

resource "aws_secretsmanager_secret_version" "whatsapp_internal" {
  count         = var.deploy_application && var.whatsapp_internal_secret != "" ? 1 : 0
  secret_id     = aws_secretsmanager_secret.whatsapp_internal.id
  secret_string = var.whatsapp_internal_secret
}

resource "aws_secretsmanager_secret_version" "whatsapp_encryption" {
  count         = var.deploy_application && var.whatsapp_encryption_key != "" ? 1 : 0
  secret_id     = aws_secretsmanager_secret.whatsapp_encryption.id
  secret_string = var.whatsapp_encryption_key
}

resource "aws_iam_role_policy" "ecs_secret_read" {
  name = "seu-carlos-showcase-read-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.database_url.arn,
        aws_secretsmanager_secret.jwt.arn,
        aws_secretsmanager_secret.cookie.arn,
        aws_secretsmanager_secret.whatsapp_internal.arn,
        aws_secretsmanager_secret.whatsapp_encryption.arn
      ]
    }]
  })
}

resource "aws_service_discovery_service" "application" {
  for_each = var.deploy_application ? { for name, spec in local.service_specs : name => spec if spec.discovery } : {}

  name = each.key

  dns_config {
    namespace_id   = aws_service_discovery_private_dns_namespace.showcase.id
    routing_policy = "MULTIVALUE"

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

}

resource "aws_ecs_task_definition" "application" {
  for_each = var.deploy_application ? local.service_specs : {}

  family                   = "seu-carlos-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name = each.key
    # Use the AWS-shaped URI in task definitions. Floci rewrites this to its
    # local registry, and can use an identically tagged image already on Docker.
    image        = "${aws_ecr_repository.application.registry_id}.dkr.ecr.${aws_ecr_repository.application.region}.amazonaws.com/${aws_ecr_repository.application.name}:${var.image_tag}"
    essential    = true
    command      = each.value.command
    portMappings = each.value.port_mappings
    environment  = [for name, value in each.value.environment : { name = name, value = value }]
    secrets      = each.value.secrets
    healthCheck = {
      command     = ["CMD-SHELL", "node -e \"const net=require('node:net');const s=net.connect(Number(process.env.PORT),'127.0.0.1');s.on('connect',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))\""]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.application[each.key].name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = each.key
      }
    }
  }])

  depends_on = [
    aws_iam_role_policy_attachment.ecs_task_execution,
    aws_iam_role_policy.ecs_secret_read,
    aws_secretsmanager_secret_version.database_url,
    aws_secretsmanager_secret_version.jwt,
    aws_secretsmanager_secret_version.cookie
  ]
}

resource "aws_ecs_service" "application" {
  for_each = var.deploy_application ? local.service_specs : {}

  name                 = "seu-carlos-${each.key}"
  cluster              = aws_ecs_cluster.showcase.id
  task_definition      = aws_ecs_task_definition.application[each.key].arn
  desired_count        = 1
  launch_type          = "FARGATE"
  force_new_deployment = true

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [lookup({ web = aws_security_group.web.id, gateway = aws_security_group.gateway.id, backend = aws_security_group.backend.id }, each.value.security_group)]
    assign_public_ip = false
  }

  dynamic "load_balancer" {
    for_each = each.key == "web" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.web.arn
      container_name   = "web"
      container_port   = 8080
    }
  }

  dynamic "service_registries" {
    for_each = each.value.discovery ? [1] : []
    content {
      registry_arn   = aws_service_discovery_service.application[each.key].arn
      container_name = each.key
      container_port = each.value.port
    }
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_secret_read
  ]
}

resource "aws_db_subnet_group" "showcase" {
  name       = "seu-carlos-showcase"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "seu-carlos-showcase"
  }
}

resource "aws_db_instance" "showcase" {
  identifier                 = "seu-carlos-showcase"
  engine                     = "postgres"
  instance_class             = "db.t4g.micro"
  allocated_storage          = 20
  max_allocated_storage      = 50
  storage_type               = "gp3"
  db_name                    = "barbershop"
  username                   = "barbershop_app"
  password                   = var.database_password
  port                       = 5432
  db_subnet_group_name       = aws_db_subnet_group.showcase.name
  vpc_security_group_ids     = [aws_security_group.database.id]
  publicly_accessible        = false
  multi_az                   = false
  backup_retention_period    = 1
  skip_final_snapshot        = true
  deletion_protection        = false
  auto_minor_version_upgrade = true

  tags = {
    Name = "seu-carlos-barbearia-showcase-database"
  }
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = format(
    "postgresql://barbershop_app:%s@%s/barbershop?schema=public",
    urlencode(var.database_password),
    aws_db_instance.showcase.endpoint
  )
}
