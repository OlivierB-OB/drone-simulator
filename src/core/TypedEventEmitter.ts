type EventHandler<T> = (data: T) => void;

/**
 * A simple, generic typed event emitter.
 * Type parameter maps event names to their payload types.
 */
export class TypedEventEmitter<EventMap extends Record<string, unknown>> {
  private listeners = new Map<keyof EventMap, Set<EventHandler<never>>>();

  on<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler<never>);
  }

  off<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>
  ): void {
    this.listeners.get(event)?.delete(handler as EventHandler<never>);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        (handler as EventHandler<EventMap[K]>)(data);
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
