// web/src/lib/opencode.ts
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
      // For web frontend, we'll use EventSource for real-time updates
      const eventSource = new EventSource(`${baseUrl}/event`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback({
            type: data.type || 'message',
            data: data,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.warn('Failed to parse event data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        callback({
          type: 'error',
          data: { error: 'EventSource connection failed' },
          timestamp: new Date().toISOString(),
        });
      };

      eventSource.onopen = () => {
        callback({
          type: 'connected',
          data: { status: 'connected' },
          timestamp: new Date().toISOString(),
        });
      };

      return () => {
        eventSource.close();
      };
    },
  };
}

export const opencode = createOpencodeClient({
  baseUrl: process.env.NEXT_PUBLIC_OPENCODE_URL || "http://localhost:4096"
})