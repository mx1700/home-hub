import Docker from 'dockerode';
import type { Service, ServiceConfig } from '~/types';
import { buildServiceUrl, parseLabelValue, parseLabelNumber } from './utils';

interface ContainerInfo {
  Id: string;
  Names: string[];
  State: string;
  Labels?: Record<string, string>;
}

export class DockerMonitor {
  private docker: Docker;
  private dockerHostIp: string;
  private eventHandlers: ((services: Service[]) => void)[] = [];

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
    const stream = await this.docker.getEvents();

    stream.on('data', async (chunk: Buffer) => {
      try {
        const event = JSON.parse(chunk.toString());

        // Only handle container-related events
        if (event.Type === 'container') {
          const services = await this.scanServices();
          this.notifyHandlers(services);
        }
      } catch (error) {
        console.error('Error parsing Docker event:', error);
      }
    });

    stream.on('error', (error) => {
      console.error('Docker event stream error:', error);
    });
  }

  onServicesUpdate(handler: (services: Service[]) => void): () => void {
    this.eventHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index >= 0) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  private notifyHandlers(services: Service[]): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(services);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }
  }
}
