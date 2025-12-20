# OpenCode CLI Tester

A bun-based CLI tool for testing the OpenCode API with interactive session management, message sending, and real-time event monitoring.

## Installation

```bash
cd cli
bun install
```

## Usage

### Interactive Mode

Start an interactive session with full session management:

```bash
bun run index.ts interactive
```

This will:
- Create a new session
- Start monitoring real-time events
- Provide an interactive menu to send messages and view history

### Direct Commands

#### Create a Session

```bash
bun run index.ts session create
```

#### Send a Message

```bash
bun run index.ts message send <session-id> "Your message here"
```

#### List Messages

```bash
bun run index.ts message list <session-id>
```

#### Monitor Events

```bash
bun run index.ts events monitor
```

## Configuration

### API URL

By default, the CLI connects to `http://localhost:4096`. You can specify a different URL:

```bash
bun run index.ts --url http://your-opencode-server:4096 interactive
```

## Features

- ✅ Session creation and management
- ✅ Interactive message sending
- ✅ Message history viewing
- ✅ Real-time event monitoring via Server-Sent Events
- ✅ Colorized output with chalk
- ✅ Error handling and validation

## Prerequisites

- Bun runtime
- OpenCode API server running (default: http://localhost:4096)

## Example Workflow

1. Start the OpenCode API server:
   ```bash
   docker run -d -p 4096:4096 opencode-api
   ```

2. Run the interactive CLI:
   ```bash
   cd cli && bun run index.ts interactive
   ```

3. Follow the interactive prompts to create sessions, send messages, and monitor events.

## Dependencies

- `chalk`: Terminal colors and styling
- `commander`: CLI argument parsing
- `inquirer`: Interactive command line prompts
- `node-fetch`: HTTP client (for compatibility)