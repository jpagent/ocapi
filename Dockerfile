FROM alpine:3.20

# Install runtime dependencies including C++ libraries needed for opencode
RUN apk add --no-cache git ca-certificates curl bash libstdc++ libgcc nodejs npm

# Create app directory and install http-proxy
RUN mkdir -p /app && cd /app && npm init -y && npm install http-proxy

# Install opencode via official install script
RUN curl -fsSL https://opencode.ai/install | bash

# Add opencode to PATH
ENV PATH="/root/.opencode/bin:$PATH"

# Create workspace directory
RUN mkdir -p /workspace

WORKDIR /workspace

# Copy pre-built static files
COPY web/out/ /app/static/

# Install http-proxy for Node.js server
RUN npm install -g http-proxy

# Create Node.js server to serve static files and proxy API
RUN printf 'const http = require("http");\nconst httpProxy = require("http-proxy");\nconst fs = require("fs");\nconst path = require("path");\n\nconst proxy = httpProxy.createProxyServer({});\n\nproxy.on("error", (err, req, res) => {\n  console.error("Proxy error:", err);\n  res.writeHead(500);\n  res.end("Proxy error");\n});\n\nconst server = http.createServer((req, res) => {\n  // Proxy API requests to OpenCode\n  if (req.url.startsWith("/session") || req.url.startsWith("/event") || req.url.startsWith("/config") || req.url.startsWith("/project")) {\n    return proxy.web(req, res, { target: "http://127.0.0.1:4097" });\n  }\n\n  // Serve static files\n  let filePath = path.join("/app/static", req.url === "/" ? "index.html" : req.url);\n  \n  // Handle client-side routing\n  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {\n    filePath = path.join("/app/static", "index.html");\n  }\n\n  const ext = path.extname(filePath);\n  const contentType = {\n    ".html": "text/html",\n    ".js": "text/javascript",\n    ".css": "text/css",\n    ".json": "application/json",\n    ".png": "image/png",\n    ".jpg": "image/jpeg",\n    ".ico": "image/x-icon"\n  }[ext] || "text/plain";\n\n  fs.readFile(filePath, (err, data) => {\n    if (err) {\n      res.writeHead(404);\n      res.end("File not found");\n      return;\n    }\n    res.writeHead(200, { "Content-Type": contentType });\n    res.end(data);\n  });\n});\n\nserver.listen(4096, "0.0.0.0", () => {\n  console.log("Server listening on port 4096");\n});' > /app/server.js

# Create startup script
RUN printf '#!/bin/bash\necho "Starting OpenCode API server on port 4097..."\nopencode serve --hostname 127.0.0.1 --port 4097 &\nsleep 2\necho "Starting Node.js server on port 4096..."\ncd /app && node server.js\n' > /start.sh && chmod +x /start.sh

# Expose the combined port
EXPOSE 4096

# Set default environment variables
ENV OPENCODE_MODEL=x-ai/grok-3-fast
ENV OPENCODE_AUTO_COMPACT=true

# Start both services
CMD ["/start.sh"]