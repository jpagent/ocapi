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

export interface OpencodeClient {
  createSession(): Promise<Session>;
  sendMessage(sessionId: string, content: string): Promise<Message>;
  getMessages(sessionId: string): Promise<Message[]>;
}

export function createOpencodeClient(options: { baseUrl: string }): OpencodeClient {
  const baseUrl = options.baseUrl;

  return {
    async createSession(): Promise<Session> {
      const response = await fetch(`${baseUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return response.json();
    },

    async getMessages(sessionId: string): Promise<Message[]> {
      const response = await fetch(`${baseUrl}/session/${sessionId}/messages`);

      if (!response.ok) {
        throw new Error(`Failed to get messages: ${response.statusText}`);
      }

      return response.json();
    },
  };
}