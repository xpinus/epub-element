import Book from './book';
import { defineEpubViewElement } from './elements';
import { createUUID, isBoolean } from '../utils';
import Rendition from './rendition';
import { LayoutMode } from './layouts';
import EventBus, { EventBusEventsEnum } from './eventbus';

import type { EpubElelementContain } from './elements';
import type { RenditionOptions } from './rendition';
import type { EpubViewHooks } from './elements/el-view';

export type EpubElementInstanceType = InstanceType<typeof EpubElement>;

type EpubElementMountOptions = RenditionOptions & {
  class?: string;
};

const instances = new Map<string, EpubElementInstanceType>();

/**
 * @description 一切的开始 entry
 */
class EpubElement {
  public uuid: string = createUUID();
  public book: Book = new Book();
  public event: EventBus = new EventBus();

  public $el: EpubElelementContain | null = null;
  public rendition: Rendition | null = null;
  public hooks: EpubViewHooks = {};

  constructor() {
    EpubElement.setInstance(this.uuid, this);
  }

  /**
   * 请求epub文件，创建EpubElement, 解析文件信息和各个文件
   * @param url epub文件路径
   * @param options
   * @returns
   */
  static openEpub(url: string) {
    const _instance = new EpubElement();

    return new Promise((resolve, reject) => {
      _instance.book
        .open(url)
        .then(() => {
          resolve(_instance);

          defineEpubViewElement();
        })
        .catch(reject);
    });
  }

  static hasInstance(uuid: string) {
    return instances.has(uuid);
  }

  static getInstance(uuid: string) {
    return instances.get(uuid);
  }

  static setInstance(uuid: string, instance: EpubElementInstanceType) {
    instances.set(uuid, instance);
  }

  static removeInstance(uuid: string) {
    instances.delete(uuid);
  }

  /**
   * 构造并渲染元素
   */
  mount(el: HTMLElement, options: EpubElementMountOptions) {
    console.log(options);

    if (!(el instanceof HTMLElement)) {
      throw new Error('el must be HTMLElement for Epub to mount');
    }

    const element = document.createElement('epub-element') as EpubElelementContain;
    element.setAttribute('uuid', this.uuid);
    this.$el = element;

    this.rendition = new Rendition({
      epubEL: this,
      layout: options.layout || LayoutMode.Scroll,
      virtual: isBoolean(options.virtual) ? options.virtual : true,
      // orientation: options.orientation,
    });

    el.replaceWith(this.$el);

    (window as any).epub = this;
  }

  /**
   * 销毁实例
   */
  destroy() {
    EpubElement.removeInstance(this.uuid);
  }
}

const EpubElementProxy = new Proxy(EpubElement, {
  construct: function () {
    throw new Error('EpubElement cannot be instantiated directly, use EpubElement.openEpub instead');
  },
});

export default EpubElementProxy;
