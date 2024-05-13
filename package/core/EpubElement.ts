import Book from './Book';
import Layout from '../display/Layout';
import { defineEpubViewElement } from '../display/EpubView';
import { createUUID } from '../utils';

import * as globalState from './state';

export type EpubElementInstanceType = InstanceType<typeof EpubElement>;

class EpubElement {
  public uuid: string;
  public book: Book;
  private layout: Layout | null;

  constructor(options: any) {
    console.log('Hello, EpubNext!', options);

    this.book = new Book();
    this.layout = null;
    this.uuid = createUUID();
    globalState.instances.set(this.uuid, this);
  }

  /**
   * 请求epub文件，创建EpubElement, 解析文件信息和各个文件
   * @param url epub文件路径
   * @param options
   * @returns
   */
  static openEpub(url: string, options: any) {
    const _instance = new EpubElement(options);

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
  mount(el: HTMLElement, options: any) {
    console.log(options);

    if (!(el instanceof HTMLElement)) {
      throw new Error('el must be HTMLElement for Epub to mount');
    }

    const container = document.createElement('div');
    container.className = 'epub-viewer-container';
    container.setAttribute('data-uuid', this.uuid);
    el.append(container);

    this.layout = new Layout({
      viewer: this,
      container: container,
      orientation: 'portrait', // landscape
      loadmethod: 'dynamic', // full
      readmode: 'continuous', // pagination
    });

    this.layout.render();

    const newView = document.createElement('epub-view');

    const test = el.querySelector('#test');

    if (test) {
      test.append(newView);
    }
  }

  /**
   * 显示   percentage cfi location
   */
  display() {}

  /**
   * 销毁实例
   */
  destroy() {}
}

const EpubElementProxy = new Proxy(EpubElement, {
  construct: function () {
    throw new Error('EpubViewer cannot be instantiated directly, use EpubViewer.openEpub instead');
  },
});

export default EpubElementProxy;
