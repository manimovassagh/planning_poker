# ── Infrastructure ───────────────────────────────────────────

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-central-1"
}

variable "instance_type" {
  description = "EC2 instance type (t3.small is enough for ~10 rooms)"
  type        = string
  default     = "t3.small"
}

variable "ebs_volume_size" {
  description = "Size in GB for the Postgres data volume"
  type        = number
  default     = 20
}

# ── Domain & HTTPS ──────────────────────────────────────────

variable "domain_name" {
  description = "Domain name for HTTPS (e.g. poker.example.com). Leave empty for HTTP-only"
  type        = string
  default     = ""
}

variable "admin_email" {
  description = "Email for Let's Encrypt certificate registration (required if domain_name is set)"
  type        = string
  default     = ""
}

# ── SSH Access ──────────────────────────────────────────────

variable "key_pair_name" {
  description = "Name of an existing AWS key pair. Leave empty to create one from ssh_public_key"
  type        = string
  default     = ""
}

variable "ssh_public_key" {
  description = "SSH public key content (used only when key_pair_name is empty)"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH into the instance"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ── Application Secrets ─────────────────────────────────────

variable "jwt_secret" {
  description = "JWT signing secret (auto-generated if empty)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret (auto-generated if empty)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "postgres_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "postgres"
}

variable "postgres_password" {
  description = "PostgreSQL password (auto-generated if empty)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "postgres_db" {
  description = "PostgreSQL database name"
  type        = string
  default     = "planning_poker"
}

# ── Docker Images ───────────────────────────────────────────

variable "api_image" {
  description = "Docker image for the API service"
  type        = string
  default     = "ghcr.io/manimovassagh/planning-poker-api:latest"
}

variable "web_image" {
  description = "Docker image for the Web service (use self-hosted tag for same-origin routing)"
  type        = string
  default     = "ghcr.io/manimovassagh/planning-poker-web:self-hosted"
}

# ── Tags ────────────────────────────────────────────────────

variable "project_name" {
  description = "Project name used for resource tagging"
  type        = string
  default     = "planning-poker"
}

variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
  default     = "production"
}
