# GraphSentinel AI - Frontend Production Dockerfile (Multi-stage build)
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Production web server stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx configuration for single page application (SPA) routing + reverse proxy
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
