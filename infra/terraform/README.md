# Terraform deployment

The default configuration targets the local Floci emulator. Keep the `floci` workspace selected for local work; never use it to manage AWS resources.

```sh
terraform workspace show
terraform plan -var='deploy_application=false'
```

Set `deploy_application=true` only after the image tag exists in the selected ECR and the secrets are supplied through an ignored local tfvars file or `TF_VAR_*` environment variables. Review the plan before applying. The application and migration task definitions are omitted while this option is false.

After applying with `deploy_application=true`, run the migration as a one-shot Fargate task before starting or updating the application services. The task uses the image selected by `image_tag`, executes `prisma migrate deploy`, reads `DATABASE_URL` from Secrets Manager, and writes its output to `/ecs/seu-carlos-showcase/migration`.

```sh
terraform output -raw migration_task_definition_arn
terraform output -raw ecs_cluster_name
terraform output -json private_subnet_ids
terraform output -raw backend_security_group_id
```

Use those outputs with `aws ecs run-task --launch-type FARGATE --network-configuration` (`assignPublicIp=DISABLED`), then inspect the task's exit code and migration log before serving traffic. Do not run the development seed automatically; it has demo credentials and requires an explicit decision about the demo account/password and fictional data.

Floci's current ECS emulator may ignore ECS `serviceRegistries` and leave Cloud Map with no registered task instances. If service hostnames such as `gateway.showcase.internal` fail to resolve, confirm with `aws ecs describe-services` and `aws servicediscovery list-instances`. A temporary Docker user-defined bridge with per-service DNS aliases can connect the currently running Floci task containers; recreate those connections after ECS replaces the tasks. This is an emulator workaround, not part of Terraform or an AWS requirement. AWS ECS with Cloud Map should register task instances through the configured `service_registries` blocks.

For AWS, select a separate workspace/state, set `use_floci=false`, supply normal AWS credentials through the standard AWS credential chain, and review all costs and the complete plan before applying. The same resource configuration still needs AWS-specific review for networking, IAM, TLS, and billing. Do not reuse Floci state or test secrets.
