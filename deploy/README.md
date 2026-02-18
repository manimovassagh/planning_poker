# Self-Hosted Deployment (AWS EC2 + Terraform)

Deploy Planning Poker to your own AWS account with a single `terraform apply`. Everything runs on one EC2 instance via Docker Compose.

## Architecture

```
Internet → [EC2 Instance]
              ├── nginx-proxy (:80/:443) ← public
              ├── web (:8080)            ← internal
              ├── api (:3001)            ← internal
              └── postgres (:5432)       ← internal + EBS volume
```

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials (`aws configure`)
- An AWS account with permissions to create EC2, EBS, EIP, and Security Groups

## Quick Start

```bash
cd deploy

# 1. Copy and edit the config
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your preferred region, instance type, etc.

# 2. Deploy
terraform init
terraform apply
```

After ~3 minutes, the app will be available at the URL shown in the output.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `eu-central-1` | AWS region |
| `instance_type` | `t3.small` | EC2 instance type |
| `ebs_volume_size` | `20` | Postgres data volume (GB) |
| `domain_name` | `""` | Domain for HTTPS (empty = HTTP only) |
| `admin_email` | `""` | Email for Let's Encrypt (required with domain) |
| `key_pair_name` | `""` | Existing AWS key pair name |
| `ssh_public_key` | `""` | SSH public key (creates new key pair) |
| `allowed_ssh_cidrs` | `["0.0.0.0/0"]` | CIDRs allowed to SSH |
| `jwt_secret` | auto-generated | JWT signing secret |
| `postgres_password` | auto-generated | Database password |
| `api_image` | `ghcr.io/.../planning-poker-api:latest` | API Docker image |
| `web_image` | `ghcr.io/.../planning-poker-web:self-hosted` | Web Docker image |

## HTTPS Setup

1. Run `terraform apply` without `domain_name` to get the Elastic IP
2. Create a DNS A record pointing your domain to the Elastic IP
3. Add `domain_name` and `admin_email` to `terraform.tfvars`
4. Run `terraform apply` again — Let's Encrypt will issue the certificate

## Useful Commands

```bash
# View outputs
terraform output app_url
terraform output -raw private_key > key.pem && chmod 600 key.pem

# SSH into the instance
ssh -i key.pem ec2-user@$(terraform output -raw public_ip)

# Watch bootstrap logs (first deploy)
ssh -i key.pem ec2-user@$(terraform output -raw public_ip) 'tail -f /var/log/user-data.log'

# View running containers
ssh -i key.pem ec2-user@$(terraform output -raw public_ip) 'cd /opt/planning-poker && docker compose ps'

# View container logs
ssh -i key.pem ec2-user@$(terraform output -raw public_ip) 'cd /opt/planning-poker && docker compose logs -f'

# Update to latest images
ssh -i key.pem ec2-user@$(terraform output -raw public_ip) 'cd /opt/planning-poker && docker compose pull && docker compose up -d'
```

## Tear Down

```bash
terraform destroy
```

Note: The Postgres EBS volume has `prevent_destroy = true`. To fully remove it, first remove the lifecycle block from `main.tf`, then run `terraform destroy` again.

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| t3.small (on-demand) | ~$15 |
| 20 GB gp3 EBS | ~$1.60 |
| Elastic IP (attached) | Free |
| **Total** | **~$17/month** |

## License

AGPL-3.0 — See [LICENSE](../LICENSE) for details.
