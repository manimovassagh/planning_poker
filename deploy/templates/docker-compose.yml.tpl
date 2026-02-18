services:
  postgres:
    image: postgres:16-alpine
    container_name: planning-poker-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${postgres_user}
      POSTGRES_PASSWORD: ${postgres_password}
      POSTGRES_DB: ${postgres_db}
    volumes:
      - /data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${postgres_user}"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    image: ${api_image}
    container_name: planning-poker-api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${postgres_user}:${postgres_password}@postgres:5432/${postgres_db}
      JWT_SECRET: ${jwt_secret}
      JWT_REFRESH_SECRET: ${jwt_refresh_secret}
      PORT: "3001"
      NODE_ENV: production
      CORS_ORIGIN: ${cors_origin}

  web:
    image: ${web_image}
    container_name: planning-poker-web
    restart: unless-stopped
    depends_on:
      - api

  nginx-proxy:
    image: nginx:alpine
    container_name: planning-poker-proxy
    restart: unless-stopped
    depends_on:
      - api
      - web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
%{ if enable_https ~}
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
%{ endif ~}
