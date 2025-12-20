FROM alpine:3.20

# Install runtime dependencies including C++ libraries needed for opencode
RUN apk add --no-cache git ca-certificates curl bash libstdc++ libgcc nodejs npm nginx

# Install opencode via official install script
RUN curl -fsSL https://opencode.ai/install | bash

# Add opencode to PATH
ENV PATH="/root/.opencode/bin:$PATH"

# Create workspace directory
RUN mkdir -p /workspace

WORKDIR /workspace

# Copy web source and build static files
COPY web/ /tmp/web/
WORKDIR /tmp/web
RUN npm ci && npm run build

# Copy built static files to nginx
RUN mkdir -p /var/www/html && cp -r out/* /var/www/html/

WORKDIR /workspace

# Configure nginx to serve static files and proxy API
RUN echo 'server {\
    listen 4096;\
    server_name localhost;\
    \
    # Serve static files\
    location / {\
        root /var/www/html;\
        index index.html;\
        try_files $uri $uri/ /index.html;\
    }\
    \
    # Proxy API requests to opencode\
    location /session {\
        proxy_pass http://127.0.0.1:4097;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
    location /event {\
        proxy_pass http://127.0.0.1:4097;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
    location /config {\
        proxy_pass http://127.0.0.1:4097;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
    location /project {\
        proxy_pass http://127.0.0.1:4097;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
}' > /etc/nginx/http.d/default.conf

# Create startup script
RUN echo '#!/bin/bash\
echo "Starting OpenCode API server on port 4097..."\
opencode serve --hostname 127.0.0.1 --port 4097 &\
\
echo "Starting nginx on port 4096..."\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

# Expose the combined port
EXPOSE 4096

# Set default environment variables
ENV OPENCODE_MODEL=x-ai/grok-3-fast
ENV OPENCODE_AUTO_COMPACT=true

# Start both services
CMD ["/start.sh"]