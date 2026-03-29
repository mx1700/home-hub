import type { ServiceConfig } from '~/types';

export function buildServiceUrl(
  config: ServiceConfig,
  dockerHostIp: string
): string {
  // Priority 1: Use url if provided
  if (config.url) {
    return config.url;
  }

  // Priority 2: Build from host + port
  const host = config.host || dockerHostIp;
  const port = config.port || 80;

  if (port === 80) {
    return `http://${host}`;
  }

  return `http://${host}:${port}`;
}

export function parseLabelValue(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function parseLabelNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}
