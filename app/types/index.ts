export interface Service {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  description: string;
  status: 'running' | 'stopped' | 'unknown';
  order: number;
}

export interface ServiceConfig {
  name: string;
  url?: string;
  host?: string;
  port?: number;
  icon?: string;
  category?: string;
  description?: string;
  order?: number;
}

export interface IconManifest {
  [url: string]: string;
}

export interface DockerLabelConfig {
  'home-hub.name': string;
  'home-hub.url'?: string;
  'home-hub.host'?: string;
  'home-hub.port'?: string;
  'home-hub.icon'?: string;
  'home-hub.category'?: string;
  'home-hub.description'?: string;
  'home-hub.order'?: string;
}
