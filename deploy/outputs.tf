output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.this.id
}

output "public_ip" {
  description = "Elastic IP address"
  value       = aws_eip.this.public_ip
}

output "app_url" {
  description = "Application URL"
  value       = local.app_url
}

output "ssh_command" {
  description = "SSH into the instance"
  value       = "ssh -i <your-key> ec2-user@${aws_eip.this.public_ip}"
}

output "setup_log" {
  description = "Watch the bootstrap progress"
  value       = "ssh ec2-user@${aws_eip.this.public_ip} 'tail -f /var/log/user-data.log'"
}

output "postgres_password" {
  description = "Generated PostgreSQL password"
  value       = local.postgres_password
  sensitive   = true
}

output "jwt_secret" {
  description = "Generated JWT secret"
  value       = local.jwt_secret
  sensitive   = true
}

output "private_key" {
  description = "Generated SSH private key (only if no key_pair_name or ssh_public_key was provided)"
  value       = try(tls_private_key.this[0].private_key_openssh, "")
  sensitive   = true
}
