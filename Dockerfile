FROM golang:1.23-alpine AS builder

# Install opencode
RUN go install github.com/sst/opencode@latest

FROM alpine:3.20

# Install runtime dependencies
RUN apk add --no-cache git ca-certificates

# Copy opencode binary
COPY --from=builder /go/bin/opencode /usr/local/bin/opencode

# Create workspace directory
RUN mkdir -p /workspace

WORKDIR /workspace

# Expose the API port
EXPOSE 4096

# Set default environment variables
ENV OPENCODE_MODEL=x-ai/grok-3-fast
ENV OPENCODE_AUTO_COMPACT=true

# Start opencode serve
ENTRYPOINT ["opencode", "serve", "--hostname", "0.0.0.0", "--port", "4096"]
