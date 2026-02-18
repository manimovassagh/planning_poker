# ── AMI: Latest Amazon Linux 2023 ────────────────────────────

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── Auto-generated secrets (when not provided) ──────────────

resource "random_password" "jwt_secret" {
  count   = var.jwt_secret == "" ? 1 : 0
  length  = 48
  special = false
}

resource "random_password" "jwt_refresh_secret" {
  count   = var.jwt_refresh_secret == "" ? 1 : 0
  length  = 48
  special = false
}

resource "random_password" "postgres_password" {
  count   = var.postgres_password == "" ? 1 : 0
  length  = 32
  special = false
}

locals {
  jwt_secret         = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt_secret[0].result
  jwt_refresh_secret = var.jwt_refresh_secret != "" ? var.jwt_refresh_secret : random_password.jwt_refresh_secret[0].result
  postgres_password  = var.postgres_password != "" ? var.postgres_password : random_password.postgres_password[0].result

  enable_https = var.domain_name != ""
  app_url      = local.enable_https ? "https://${var.domain_name}" : "http://${aws_eip.this.public_ip}"
  cors_origin  = local.app_url
  server_name  = var.domain_name != "" ? var.domain_name : "_"

  # Render templates
  nginx_conf_content = templatefile("${path.module}/templates/nginx.conf.tpl", {
    domain_name = var.domain_name
    server_name = local.server_name
  })

  docker_compose_content = templatefile("${path.module}/templates/docker-compose.yml.tpl", {
    postgres_user      = var.postgres_user
    postgres_password  = local.postgres_password
    postgres_db        = var.postgres_db
    api_image          = var.api_image
    web_image          = var.web_image
    jwt_secret         = local.jwt_secret
    jwt_refresh_secret = local.jwt_refresh_secret
    cors_origin        = local.cors_origin
    enable_https       = local.enable_https
  })
}

# ── SSH Key Pair (when not using existing) ───────────────────

resource "tls_private_key" "this" {
  count     = var.key_pair_name == "" && var.ssh_public_key == "" ? 1 : 0
  algorithm = "ED25519"
}

resource "aws_key_pair" "this" {
  count      = var.key_pair_name == "" ? 1 : 0
  key_name   = "${var.project_name}-${var.environment}"
  public_key = var.ssh_public_key != "" ? var.ssh_public_key : tls_private_key.this[0].public_key_openssh
}

locals {
  key_pair_name = var.key_pair_name != "" ? var.key_pair_name : aws_key_pair.this[0].key_name
}

# ── EBS Volume for Postgres data ────────────────────────────

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_ebs_volume" "postgres_data" {
  availability_zone = data.aws_availability_zones.available.names[0]
  size              = var.ebs_volume_size
  type              = "gp3"

  tags = {
    Name = "${var.project_name}-postgres-data"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# ── Elastic IP (allocated first, associated after instance) ──

resource "aws_eip" "this" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# ── EC2 Instance ─────────────────────────────────────────────

resource "aws_instance" "this" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = local.key_pair_name
  vpc_security_group_ids = [aws_security_group.planning_poker.id]
  availability_zone      = data.aws_availability_zones.available.names[0]

  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    docker_compose_content = local.docker_compose_content
    nginx_conf_content     = local.nginx_conf_content
    domain_name            = var.domain_name
    admin_email            = var.admin_email
    app_url                = local.app_url
  })

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

resource "aws_volume_attachment" "postgres_data" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.postgres_data.id
  instance_id = aws_instance.this.id
}

# ── Associate EIP with instance ──────────────────────────────

resource "aws_eip_association" "this" {
  instance_id   = aws_instance.this.id
  allocation_id = aws_eip.this.id
}
