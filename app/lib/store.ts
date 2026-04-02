import type { Service } from '~/types';
import { EventEmitter } from './event-emitter';

export class ServiceStore {
  private services: Service[] = [];
  private emitter = new EventEmitter<Service[]>();

  getServices(): Service[] {
    return [...this.services];
  }

  setServices(services: Service[]): void {
    this.services = services;
    this.emitter.emit(this.services);
  }

  updateService(updatedService: Service): void {
    const index = this.services.findIndex(s => s.id === updatedService.id);
    if (index >= 0) {
      this.services[index] = updatedService;
      this.emitter.emit(this.services);
    }
  }

  onChange(listener: (services: Service[]) => void): () => void {
    return this.emitter.subscribe(listener);
  }
}

export const serviceStore = new ServiceStore();
