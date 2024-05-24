import Book from './book';
import { defineEpubViewElement } from './elements';
import { createUUID } from '../utils';
import { setGlobalInstance, removeGlobalInstance } from './instances';

import type { EpubElelementContain } from './elements';

export type EpubElementInstanceType = InstanceType<typeof EpubElement>;

type EpubElementMountOptions = {
  class?: string;
};

/**
 * @description 一切的开始 entry
 */
class EpubElement {
  public uuid: string;
  public book: Book;

  constructor() {
    this.book = new Book();
    this.uuid = createUUID();
    setGlobalInstance(this.uuid, this);
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

  /**
   * 构造并渲染元素
   */
  mount(el: HTMLElement, options: EpubElementMountOptions) {
    console.log(options);

    if (!(el instanceof HTMLElement)) {
      throw new Error('el must be HTMLElement for Epub to mount');
    }

    const epubEl = document.createElement('epub-element') as EpubElelementContain;
    epubEl.setAttribute('uuid', this.uuid);
    epubEl.book = this.book;

    el.replaceWith(epubEl);

    (window as any).epub = epubEl;
  }

  /**
   * 显示   percentage cfi location
   */
  display() {}

  /**
   * 销毁实例
   */
  destroy() {
    removeGlobalInstance(this.uuid);
  }
}

const EpubElementProxy = new Proxy(EpubElement, {
  construct: function () {
    throw new Error('EpubViewer cannot be instantiated directly, use EpubViewer.openEpub instead');
  },
});

export default EpubElementProxy;
