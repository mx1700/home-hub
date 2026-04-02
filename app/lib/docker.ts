import Docker from 'dockerode';
import type { Readable } from 'stream';
import type { Service, ServiceConfig } from '~/types';
import { buildServiceUrl, parseLabelValue, parseLabelNumber } from './utils';
import { EventEmitter } from './event-emitter';

interface ContainerInfo {
  Id: string;
  Names: string[];
  State: string;
  Labels?: Record<string, string>;
}

// Docker event actions that indicate a meaningful container state change
const RELEVANT_ACTIONS = new Set([
  'start', 'stop', 'die', 'destroy', 'create', 'pause', 'unpause',
]);

export class DockerMonitor {
  private docker: Docker;
  private dockerHostIp: string;
  private emitter = new EventEmitter<Service[]>();
  private eventStream: Readable | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly DEBOUNCE_MS = 500;

  constructor(socketPath: string, dockerHostIp: string = 'localhost') {
    this.docker = new Docker({ socketPath });
    this.dockerHostIp = dockerHostIp;
  }

  extractServiceConfig(container: ContainerInfo): ServiceConfig | null {
    const labels = container.Labels || {};
    const name = labels['home-hub.name'];

    if (!name) {
      return null;
    }

    return {
      name: name.trim(),
      url: parseLabelValue(labels['home-hub.url']),
      host: parseLabelValue(labels['home-hub.host']),
      port: parseLabelNumber(labels['home-hub.port']),
      icon: parseLabelValue(labels['home-hub.icon']),
      category: parseLabelValue(labels['home-hub.category']) || '其他',
      description: parseLabelValue(labels['home-hub.description']),
      order: parseLabelNumber(labels['home-hub.order']) || 0,
    };
  }

  async scanServices(): Promise<Service[]> {
    const containers = await this.docker.listContainers({ all: true });
    const services: Service[] = [];

    for (const container of containers) {
      const config = this.extractServiceConfig(container as ContainerInfo);
      if (config) {
        const url = buildServiceUrl(config, this.dockerHostIp);
        services.push({
          id: container.Id,
          name: config.name,
          url,
          icon: config.icon || '',
          category: config.category || '其他',
          description: config.description || '',
          status: container.State === 'running' ? 'running' : 'stopped',
          order: config.order || 0,
        });
      }
    }

    // Sort by order
    return services.sort((a, b) => a.order - b.order);
  }

  async startEventListener(): Promise<void> {
    if (this.eventStream) {
      (this.eventStream as any).destroy();
    }

    const stream = (await this.docker.getEvents()) as any;
    this.eventStream = stream;

    stream.on('data', (chunk: Buffer) => {
      try {
        const event = JSON.parse(chunk.toString());

        if (event.Type === 'container' && RELEVANT_ACTIONS.has(event.Action)) {
          this.debouncedScan();
        }
      } catch {
        // Partial chunk or malformed JSON - ignore
      }
    });

    stream.on('error', (error: Error) => {
      console.error('Docker event stream error:', error);
      this.reconnectEventStream();
    });
  }

  private debouncedScan(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(async () => {
      this.debounceTimer = null;
      try {
        const services = await this.scanServices();
        this.emitter.emit(services);
      } catch (error) {
        console.error('Error scanning services:', error);
      }
    }, DockerMonitor.DEBOUNCE_MS);
  }

  private reconnectEventStream(): void {
    // Clean up old stream
    if (this.eventStream) {
      (this.eventStream as any).destroy();
      this.eventStream = null;
    }
    // Reconnect after a short delay
    setTimeout(() => {
      this.startEventListener().catch((error) => {
        console.error('Failed to reconnect Docker event stream:', error);
      });
    }, 5000);
  }

  stopEventListener(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.eventStream) {
      (this.eventStream as any).destroy();
      this.eventStream = null;
    }
  }

  onServicesUpdate(handler: (services: Service[]) => void): () => void {
    return this.emitter.subscribe(handler);
  }
}
