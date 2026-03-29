import { useEffect, useState } from 'react';
import type { Service } from '~/types';
import type { CategoriesConfig } from './categories';

interface SSEMessage {
  type: 'init' | 'services.update' | 'categories.update';
  services?: Service[];
  categoriesConfig?: CategoriesConfig;
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
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          if (data.type === 'init') {
            if (data.services) {
              setServices(data.services);
            }
            if (data.categoriesConfig) {
              setCategoriesConfig(data.categoriesConfig);
            }
          } else if (data.type === 'services.update') {
            if (data.services) {
              setServices(data.services);
            }
          } else if (data.type === 'categories.update') {
            if (data.categoriesConfig) {
              setCategoriesConfig(data.categoriesConfig);
            }
          }
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
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, []);

  return { services, categoriesConfig, connected, error };
}
