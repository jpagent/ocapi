FROM alpine:3.20

# Install runtime dependencies including C++ libraries needed for opencode
RUN apk add --no-cache git ca-certificates curl bash libstdc++ libgcc

# Install opencode via official install script
RUN curl -fsSL https://opencode.ai/install | bash

# Add opencode to PATH
ENV PATH="/root/.opencode/bin:$PATH"

# Create workspace directory
RUN mkdir -p /workspace

WORKDIR /workspace

# Expose the API port
EXPOSE 4097

# Set default environment variables
ENV OPENCODE_MODEL=x-ai/grok-3-fast
ENV OPENCODE_AUTO_COMPACT=true

# Start the API server
CMD ["opencode", "serve", "--hostname", "0.0.0.0", "--port", "4097"]