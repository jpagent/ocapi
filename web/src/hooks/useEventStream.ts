import { useState, useEffect } from 'react';

export interface OpencodeEvent {
  type: string;
  data: any;
  timestamp?: string;
}

export function useEventStream(baseUrl: string) {
  const [events, setEvents] = useState<OpencodeEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`${baseUrl}/event`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const opencodeEvent: OpencodeEvent = {
          ...data,
          timestamp: new Date().toISOString(),
        };
        setEvents(prev => [...prev, opencodeEvent]);
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [baseUrl]);

  return { events, connected };
}