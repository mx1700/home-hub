import { useEffect, useState } from 'react';
import type { Service } from '~/types';
import type { CategoriesConfig } from './categories';

interface SSEMessage {
  type: 'init' | 'services.update' | 'categories.update';
  services?: Service[];
  categoriesConfig?: CategoriesConfig;
}

function isSSEMessage(data: unknown): data is SSEMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    ['init', 'services.update', 'categories.update'].includes((data as any).type)
  );
}

export function useSSE() {
  const [services, setServices] = useState<Service[]>([]);
  const [categoriesConfig, setCategoriesConfig] = useState<CategoriesConfig>({
    categories: [],
    defaultOrder: 999,
  });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch from API
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.services) {
          setServices(data.services);
        }
        if (data.categoriesConfig) {
          setCategoriesConfig(data.categoriesConfig);
        }
      })
      .catch(err => console.error('Failed to fetch services:', err));
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          if (!isSSEMessage(parsed)) {
            console.error('Invalid SSE message format:', parsed);
            return;
          }

          const handlers: Record<SSEMessage['type'], () => void> = {
            'init': () => {
              parsed.services && setServices(parsed.services);
              parsed.categoriesConfig && setCategoriesConfig(parsed.categoriesConfig);
            },
            'services.update': () => {
              parsed.services && setServices(parsed.services);
            },
            'categories.update': () => {
              parsed.categoriesConfig && setCategoriesConfig(parsed.categoriesConfig);
            },
          };

          handlers[parsed.type]?.();
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        setError('Connection lost');
        eventSource?.close();

        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      eventSource?.close();
    };
  }, []);

  return { services, categoriesConfig, connected, error };
}
