import { singleton } from '../utils';

type Effect = Function;

export enum EventBusEventsEnum {
  VIEW_CONNECTED, // 当一个view被添加到文档中
  VIEW_SIZE_CHANGE, // 当一个view的尺寸发生变化
  CONTENT_LINK_CLICKED, // 内容的跳转链接被点击
}

class EventBus {
  eventMap: Map<EventBusEventsEnum, Set<Effect>> = new Map();

  on(type: EventBusEventsEnum, fn: Effect) {
    if (!this.eventMap.has(type)) {
      this.eventMap.set(type, new Set([]));
    }

    this.eventMap.get(type)!.add(fn);
  }

  off(type: EventBusEventsEnum, fn?: Effect) {
    if (!this.eventMap.has(type)) {
      return;
    }

    if (!fn) {
      this.eventMap.delete(type);
    } else {
      this.eventMap.get(type)!.delete(fn);
    }
  }

  emit(type: EventBusEventsEnum, ...args: any[]) {
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
