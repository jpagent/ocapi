# OpenCode Web Application Plan

A web application powered by the `opencode serve` subcommand, using ACP (Agent Client Protocol) to control OpenCode programmatically.

## Overview

This project creates a browser-based interface for OpenCode, an open-source terminal AI coding agent. The web app will communicate with OpenCode's HTTP API exposed by `opencode serve` to provide remote control and real-time interaction with the AI agent.

**Default Model**: `x-ai/grok-3-fast` (Grok Code Fast 1)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Container                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │              opencode serve                      │    │
│  │              (0.0.0.0:4096)                      │    │
│  │                                                  │    │
│  │  Model: x-ai/grok-3-fast                        │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              /workspace                          │    │
│  │              (mounted volume)                    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
              │
              │ HTTP/SSE :4096
              ▼
┌─────────────────────────────────────────────────────────┐
│                   External Clients                       │
│           (curl, web browser, SDK clients)               │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker installed

## Phase 1: Docker Configuration

### 1.1 Dockerfile

```dockerfile
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
```

### 1.2 Docker Compose (Optional)

```yaml
# docker-compose.yml
version: "3.8"

services:
  opencode:
    build: .
    ports:
      - "4096:4096"
    environment:
      - OPENCODE_MODEL=x-ai/grok-3-fast
    volumes:
      - ./workspace:/workspace
    restart: unless-stopped
```

### 1.3 Build and Run

```bash
# Build the image
docker build -t opencode-api .

# Run the container
docker run -d \
  --name opencode-api \
  -p 4096:4096 \
  -v $(pwd)/workspace:/workspace \
  opencode-api
```

## Phase 2: API Configuration

### 2.1 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_MODEL` | `x-ai/grok-3-fast` | Default model to use |
| `OPENCODE_AUTO_COMPACT` | `true` | Auto-compact context |

> **Note**: Grok models work without an API key in OpenCode.

### 2.2 Key API Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| Sessions | `POST /session` | Create a new chat session |
| Sessions | `GET /session/{id}/messages` | Get session message history |
| Messages | `POST /session/{id}/message` | Send a prompt to the agent |
| Files | `GET /project/files` | List project files |
| Files | `GET /file/{path}` | Read file content |
| Commands | `POST /command` | Execute slash commands |
| Events | `GET /event` | SSE stream for real-time updates |
| Config | `GET /config` | Get current configuration |
| Models | `GET /models` | List available AI models |

## Phase 3: API Usage

### 3.1 Create a Session

```bash
curl -X POST http://localhost:4096/session \
  -H "Content-Type: application/json"
```

### 3.2 Send a Message

```bash
curl -X POST http://localhost:4096/session/{session_id}/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, world!"}'
```

### 3.3 Stream Events (SSE)

```bash
curl -N http://localhost:4096/event
```

## Phase 4: Web Frontend (Optional)

### 4.1 SDK Integration

```typescript
// lib/opencode.ts
import { createOpencodeClient } from "@opencode-ai/sdk"

export const opencode = createOpencodeClient({
  baseUrl: process.env.NEXT_PUBLIC_OPENCODE_URL || "http://localhost:4096"
})
```

### 4.2 SSE Event Streaming

```typescript
// hooks/useEventStream.ts
export function useEventStream(baseUrl: string) {
  const [events, setEvents] = useState<OpencodeEvent[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource(`${baseUrl}/event`)
    eventSource.onopen = () => setConnected(true)
    eventSource.onerror = () => setConnected(false)
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setEvents(prev => [...prev, data])
    }
    return () => eventSource.close()
  }, [baseUrl])

  return { events, connected }
}
```

## Phase 5: ACP Integration (Optional)

For IDE-style integration, configure ACP:

```json
{
  "agent": {
    "command": "opencode",
    "args": ["acp"],
    "env": {
      "OPENCODE_MODEL": "x-ai/grok-3-fast"
    }
  }
}
```

| Feature | HTTP API (serve) | ACP |
|---------|------------------|-----|
| Use Case | Web apps, mobile | IDE integration |
| Protocol | HTTP + SSE | JSON-RPC over stdio |
| Multi-client | Yes | Single client |
| Remote access | Yes | Local only |

**Recommendation**: Use `opencode serve` for web applications.

## Phase 6: Security Considerations

### 6.1 Production Deployment

```bash
# Bind to localhost only for security
docker run -d \
  -p 127.0.0.1:4096:4096 \
  opencode-api
```

### 6.2 Security Checklist

- [ ] Never expose `opencode serve` directly to the internet without authentication
- [ ] Use HTTPS in production (via reverse proxy)
- [ ] Implement rate limiting
- [ ] Audit file access permissions in mounted volumes

## Phase 7: Implementation Checklist

### MVP

- [ ] Dockerfile with opencode and Grok model
- [ ] Docker Compose for easy deployment
- [ ] API accessible via curl
- [ ] Session creation and message sending
- [ ] SSE event streaming

### V1.0

- [ ] Web frontend with SDK
- [ ] Session management UI
- [ ] File explorer
- [ ] Cost tracking

### V2.0

- [ ] Multi-model support
- [ ] Authentication layer
- [ ] Rate limiting
- [ ] Kubernetes deployment

---

## Final Validation Test

The following test validates the complete setup by running the Docker container and sending a prompt to solve FizzBuzz in Elixir.

### Step 1: Build and Run

```bash
# Build the Docker image
docker build -t opencode-api .

# Run the container
docker run -d \
  --name opencode-test \
  -p 4096:4096 \
  -v $(pwd)/workspace:/workspace \
  opencode-api

# Wait for startup
sleep 5
```

### Step 2: Create a Session

```bash
# Create a new session and capture the session ID
SESSION_ID=$(curl -s -X POST http://localhost:4096/session \
  -H "Content-Type: application/json" | jq -r '.id')

echo "Session ID: $SESSION_ID"
```

### Step 3: Send FizzBuzz Prompt

```bash
# Send the prompt to solve FizzBuzz in Elixir
curl -X POST "http://localhost:4096/session/${SESSION_ID}/message" \
  -H "Content-Type: application/json" \
  -d '{"content": "solve fizzbuzz in elixir"}'
```

### Step 4: Check the Response

```bash
# Get the session messages to see the response
curl -s "http://localhost:4096/session/${SESSION_ID}/messages" | jq
```

### Expected Output

The agent should respond with an Elixir FizzBuzz implementation like:

```elixir
defmodule FizzBuzz do
  def run(n) do
    Enum.each(1..n, fn x ->
      cond do
        rem(x, 15) == 0 -> IO.puts("FizzBuzz")
        rem(x, 3) == 0 -> IO.puts("Fizz")
        rem(x, 5) == 0 -> IO.puts("Buzz")
        true -> IO.puts(x)
      end
    end)
  end
end

FizzBuzz.run(100)
```

### One-Liner Test

```bash
# Complete test in one command
docker run --rm -p 4096:4096 opencode-api &
sleep 5 && \
SESSION=$(curl -s -X POST http://localhost:4096/session | jq -r '.id') && \
curl -X POST "http://localhost:4096/session/${SESSION}/message" \
  -H "Content-Type: application/json" \
  -d '{"content": "solve fizzbuzz in elixir"}' && \
sleep 10 && \
curl -s "http://localhost:4096/session/${SESSION}/messages" | jq '.[-1].content'
```

### Cleanup

```bash
docker stop opencode-test && docker rm opencode-test
```

---

## Resources

- [OpenCode Documentation](https://opencode.ai/docs/)
- [OpenCode Server Docs](https://opencode.ai/docs/server/)
- [OpenCode GitHub](https://github.com/sst/opencode)
