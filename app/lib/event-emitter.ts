type Listener<T> = (data: T) => void;

export class EventEmitter<T> {
  private listeners: Listener<T>[] = [];

  emit(data: T): void {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    }
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }
}
