import { DockerMonitor } from "./docker";
import { IconManager } from "./icons";
import { serviceStore } from "./store";

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const DATA_DIR = process.env.DATA_DIR || "./data";
const DOCKER_HOST_IP = process.env.DOCKER_HOST_IP || "host.docker.internal";

let initialized = false;

export async function initializeServices() {
  if (initialized) return;

  try {
    const dockerMonitor = new DockerMonitor(DOCKER_SOCKET, DOCKER_HOST_IP);
    const iconManager = new IconManager(DATA_DIR);

    // Initial scan
    const services = await dockerMonitor.scanServices();

    // Download icons for services
    await iconManager.updateServiceIcons(services);

    // Update icon paths
    const servicesWithIcons = services.map(service => ({
      ...service,
      icon: iconManager.getIconPath(service.icon) || service.icon,
    }));

    serviceStore.setServices(servicesWithIcons);

    // Start listening for Docker events
    await dockerMonitor.startEventListener();

    // Subscribe to Docker events
    dockerMonitor.onServicesUpdate(async (services) => {
      await iconManager.updateServiceIcons(services);
      const servicesWithIcons = services.map(service => ({
        ...service,
        icon: iconManager.getIconPath(service.icon) || service.icon,
      }));
      serviceStore.setServices(servicesWithIcons);
    });

    initialized = true;
    console.log("Home Hub initialized successfully");
  } catch (error) {
    console.error("Failed to initialize services:", error);
  }
}
