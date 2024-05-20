import { singleton } from '../utils';

type Effect = Function;

export enum EventBusEventType {
  VIEW_SIZE_CHANGE,
}

class EventBus {
  eventMap: Map<EventBusEventType, Effect[]> = new Map();

  on(type: EventBusEventType, fn: Effect) {
    if (!this.eventMap.has(type)) {
      this.eventMap.set(type, []);
    }

    this.eventMap.get(type)!.push(fn);
  }

  off(type: EventBusEventType, fn?: Effect) {
    if (!this.eventMap.has(type)) {
      return;
    }

    if (!fn) {
      this.eventMap.delete(type);
    } else {
      const index = this.eventMap.get(type)!.indexOf(fn);
      if (index > -1) {
        this.eventMap.get(type)!.splice(index, 1);
      }
    }
  }

  emit(type: EventBusEventType, ...args: any[]) {
    if (!this.eventMap.has(type)) {
      return;
    }

    this.eventMap.get(type)!.forEach((fn) => {
      fn(...args);
    });
  }
}

// 单例
const EventBusSingleton = singleton(EventBus);

export default new EventBusSingleton();
