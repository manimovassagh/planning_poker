#!/bin/bash
set -euo pipefail
exec > /var/log/user-data.log 2>&1

echo "=== Planning Poker EC2 Bootstrap ==="
echo "Started at: $(date)"

# ── 1. Install Docker ───────────────────────────────────────
echo "Installing Docker..."
dnf update -y
dnf install -y docker
systemctl enable docker
systemctl start docker

# Install docker compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
ARCH=$(uname -m)
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$${ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "Docker version: $(docker --version)"
echo "Compose version: $(docker compose version)"

# ── 2. Mount EBS volume for Postgres data ───────────────────
echo "Setting up EBS volume..."

# Wait for the EBS volume device to appear
DEVICE=""
for i in $(seq 1 60); do
  if [ -e /dev/xvdf ]; then
    DEVICE="/dev/xvdf"
    break
  elif [ -e /dev/nvme1n1 ]; then
    DEVICE="/dev/nvme1n1"
    break
  fi
  echo "Waiting for EBS volume... ($${i}/60)"
  sleep 2
done

if [ -z "$${DEVICE}" ]; then
  echo "ERROR: EBS volume not found after 120s"
  exit 1
fi

echo "Found EBS device at $${DEVICE}"

# Only format if not already formatted
if ! blkid "$${DEVICE}" > /dev/null 2>&1; then
  echo "Formatting $${DEVICE}..."
  mkfs.ext4 "$${DEVICE}"
fi

mkdir -p /data/postgres
mount "$${DEVICE}" /data/postgres
echo "$${DEVICE} /data/postgres ext4 defaults,nofail 0 2" >> /etc/fstab

# Postgres container runs as UID 999
chown 999:999 /data/postgres

# ── 3. Create application directory ─────────────────────────
echo "Writing application configs..."
mkdir -p /opt/planning-poker/nginx

# ── 4. Write docker-compose.yml ─────────────────────────────
cat > /opt/planning-poker/docker-compose.yml << 'COMPOSE_EOF'
${docker_compose_content}
COMPOSE_EOF

# ── 5. Write nginx reverse proxy config ─────────────────────
cat > /opt/planning-poker/nginx/default.conf << 'NGINX_EOF'
${nginx_conf_content}
NGINX_EOF

# ── 6. HTTPS setup (conditional) ────────────────────────────
%{ if domain_name != "" ~}
echo "Setting up Let's Encrypt for ${domain_name}..."
dnf install -y certbot
mkdir -p /var/www/certbot

certbot certonly --standalone \
  --non-interactive --agree-tos \
  --email "${admin_email}" \
  -d "${domain_name}"

# Auto-renewal cron (renew + restart nginx)
echo "0 3 * * * certbot renew --quiet --post-hook 'docker compose -f /opt/planning-poker/docker-compose.yml restart nginx-proxy'" \
  | crontab -

echo "TLS certificate obtained for ${domain_name}"
%{ endif ~}

# ── 7. Pull images and start services ───────────────────────
echo "Starting Planning Poker..."
cd /opt/planning-poker
docker compose pull
docker compose up -d

# ── 8. Health check ─────────────────────────────────────────
echo "Waiting for API to become healthy..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "API is healthy!"
    break
  fi
  echo "Waiting for API... ($${i}/60)"
  sleep 5
done

echo ""
echo "=== Bootstrap Complete ==="
echo "Finished at: $(date)"
echo "App URL: ${app_url}"
docker compose ps
