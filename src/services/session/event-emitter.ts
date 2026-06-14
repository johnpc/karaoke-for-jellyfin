// Event system for session manager
import { EventCallback, SESSION_EVENT_TYPES } from "./types";

export class SessionEventEmitter {
  private eventListeners: Map<string, EventCallback[]> = new Map();

  constructor() {
    SESSION_EVENT_TYPES.forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  on(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}
