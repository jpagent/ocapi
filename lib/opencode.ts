// lib/opencode.ts
export interface Session {
  id: string;
}

export interface Message {
  id: string;
  content: string;
  role: string;
  timestamp: string;
}

export interface ApiMessage {
  info: {
    id: string;
    sessionID: string;
    role: string;
    time: {
      created: number;
      completed?: number;
    };
  };
  parts: Array<{
    id: string;
    type: string;
    text?: string;
    time?: {
      start: number;
      end: number;
    };
  }>;
}

export interface OpencodeEvent {
  type: string;
  data: any;
  timestamp?: string;
}

export interface OpencodeClient {
  createSession(): Promise<Session>;
  sendMessage(sessionId: string, content: string): Promise<Message>;
  getMessages(sessionId: string): Promise<Message[]>;
  connectEvents(callback: (event: OpencodeEvent) => void): () => void;
}

export function createOpencodeClient(options: { baseUrl: string }): OpencodeClient {
  const baseUrl = options.baseUrl;

  return {
    async createSession(): Promise<Session> {
      const response = await fetch(`${baseUrl}/session`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      return response.json();
    },

    async sendMessage(sessionId: string, content: string): Promise<Message> {
      const response = await fetch(`${baseUrl}/session/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parts: [{
            type: "text",
            text: content
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const apiMessage: ApiMessage = await response.json();

      // Extract text content from parts
      const textParts = apiMessage.parts.filter(part => part.type === 'text');
      const messageContent = textParts.map(part => part.text).join('').trim();

      return {
        id: apiMessage.info.id,
        content: messageContent,
        role: apiMessage.info.role,
        timestamp: new Date(apiMessage.info.time.created).toISOString(),
      };
    },

    async getMessages(sessionId: string): Promise<Message[]> {
      try {
        const response = await fetch(`${baseUrl}/session/${sessionId}/messages`);

        if (!response.ok) {
          // If the endpoint returns HTML or fails, return empty array
          // This might happen if the messages API is not fully implemented
          console.warn(`Messages endpoint returned ${response.status}, returning empty messages`);
          return [];
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        } else {
          // If not JSON, return empty array
          console.warn('Messages endpoint returned non-JSON response, returning empty messages');
          return [];
        }
      } catch (error) {
        console.warn('Failed to fetch messages:', error.message);
        return [];
      }
    },

    connectEvents(callback: (event: OpencodeEvent) => void): () => void {
      // For CLI, we'll use polling since EventSource is not available in Node.js/Bun
      // In a real implementation, you might want to implement proper SSE support
      let isConnected = false;
      let pollCount = 0;

      console.log('📡 Starting event monitoring (polling mode)...');

      const interval = setInterval(async () => {
        try {
          // Simple connectivity check - in a real implementation you'd want to
          // implement proper SSE or WebSocket support
          const response = await fetch(`${baseUrl}/config`, {
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });

          if (response.ok && !isConnected) {
            isConnected = true;
            console.log('📡 Connected to API server');
          } else if (!response.ok && isConnected) {
            isConnected = false;
            console.log('📡 Lost connection to API server');
          }

          // For demonstration, we'll simulate occasional events
          // In a real implementation, you'd poll an events endpoint or use WebSockets
          pollCount++;
          if (pollCount % 10 === 0) { // Every 10 polls (30 seconds at 3-second intervals)
            const mockEvent: OpencodeEvent = {
              type: 'heartbeat',
              data: { pollCount, timestamp: new Date().toISOString() },
              timestamp: new Date().toISOString(),
            };
            callback(mockEvent);
          }
        } catch (error) {
          if (isConnected) {
            isConnected = false;
            console.log('📡 Lost connection to API server');
          }
          // Ignore polling errors in CLI mode
        }
      }, 3000); // Poll every 3 seconds

      return () => {
        clearInterval(interval);
        console.log('📡 Stopped event monitoring');
      };
    },
  };
}