import type { Service } from '~/types';

export class ServiceStore {
  private services: Service[] = [];
  private listeners: ((services: Service[]) => void)[] = [];

  getServices(): Service[] {
    return [...this.services];
  }

  setServices(services: Service[]): void {
    this.services = services;
    this.notifyListeners();
  }

  updateService(updatedService: Service): void {
    const index = this.services.findIndex(s => s.id === updatedService.id);
    if (index >= 0) {
      this.services[index] = updatedService;
      this.notifyListeners();
    }
  }

  onChange(listener: (services: Service[]) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.services);
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    }
  }
}

// Singleton instance
export const serviceStore = new ServiceStore();
