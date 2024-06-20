import { singleton } from '../utils';

type Effect = Function;

export enum EventBusEventsEnum {
  VIEW_CONNECTED = 'view-connected', // 当一个view被添加到文档中
  VIEW_SIZE_CHANGE = 'view-size-change', // 当一个view的尺寸发生变化
  CONTENT_LINK_CLICKED = 'content-link-clicked', // 内容的跳转链接被点击
  RENDERED = 'rendered', // 渲染完成, 可以获得viewCache
  RENDER_UPDATED = 'render-updated', // 渲染更新, 虚拟列表当前展示内容变化后触发
}

/**
 * @description 内部事件总线
 */
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

export default EventBus;
