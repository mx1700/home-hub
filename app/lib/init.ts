import { DockerMonitor } from "./docker";
import { IconManager } from "./icons";
import { serviceStore } from "./store";

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const DATA_DIR = process.env.DATA_DIR || "./data";
const DOCKER_HOST_IP = process.env.DOCKER_HOST_IP || "host.docker.internal";

let initialized = false;
let dockerMonitor: DockerMonitor | null = null;
let iconManager: IconManager | null = null;
let unsubscribeDocker: (() => void) | null = null;

export async function initializeServices() {
  if (initialized) return;

  try {
    dockerMonitor = new DockerMonitor(DOCKER_SOCKET, DOCKER_HOST_IP);
    iconManager = new IconManager(DATA_DIR);

    // Initial scan
    const services = await dockerMonitor.scanServices();

    // Download icons for services
    await iconManager.updateServiceIcons(services);

    // Update icon paths
    const servicesWithIcons = services.map(service => ({
      ...service,
      icon: iconManager!.getIconPath(service.icon) || service.icon,
    }));

    serviceStore.setServices(servicesWithIcons);

    // Start listening for Docker events
    await dockerMonitor.startEventListener();

    // Subscribe to Docker events
    unsubscribeDocker = dockerMonitor.onServicesUpdate(async (services) => {
      const manager = iconManager;
      if (!manager) return;
      await manager.updateServiceIcons(services);
      const updatedServices = services.map(service => ({
        ...service,
        icon: manager.getIconPath(service.icon) || service.icon,
      }));
      serviceStore.setServices(updatedServices);
    });

    initialized = true;
    console.log("Home Hub initialized successfully");
  } catch (error) {
    console.error("Failed to initialize services:", error);
  }
}

export function cleanup() {
  if (unsubscribeDocker) {
    unsubscribeDocker();
    unsubscribeDocker = null;
  }
  if (dockerMonitor) {
    dockerMonitor.stopEventListener();
    dockerMonitor = null;
  }
  iconManager = null;
  initialized = false;
}

export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
}

setInterval(() => {
  const mem = getMemoryUsage();
  console.log(`Memory: RSS=${mem.rss}MB, Heap=${mem.heapUsed}/${mem.heapTotal}MB`);
}, 60000);

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
