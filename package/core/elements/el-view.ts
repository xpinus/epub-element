import CustomElement from './customEl';
import { EpubElementHooks } from '../hooks';
import { getGlobalInstance } from '../instances';
import eventbus, { EventBusEventsEnum } from '../eventbus';

import type { EpubElementInstanceType } from '../epub-element';

/**
 * @description web component实现 epub 文件具体页面内容的渲染，以及样式隔离
 */
export default class EpubView extends CustomElement {
  href: string;
  epubEl: EpubElementInstanceType;
  hooks: EpubElementHooks = new EpubElementHooks();
  $head: HTMLElement;
  $body: HTMLElement;

  static get observedAttributes() {
    return ['style'];
  }

  constructor() {
    super();

    const rootUUID = this.getAttribute('root')!;
    const EpubElementInstance = getGlobalInstance(rootUUID);
    if (!EpubElementInstance) {
      throw new Error('no root for epub-view: ' + rootUUID);
    }
    this.epubEl = EpubElementInstance;

    this.href = this.getAttribute('href')!;
    if (!this.href) {
      throw new Error('no href for epub-view');
    }

    this.$head = document.createElement('epub-view-head');
    this.$body = document.createElement('epub-view-body');

    this.setHead();
    this.setBody();
  }

  /**
   * 当元素被添加到文档中时调用
   */
  async connectedCallback() {
    const rect = this.setRect();

    if (rect.height != this.height || rect.width != this.width) {
      eventbus.emit(EventBusEventsEnum.VIEW_SIZE_CHANGE);
    }

    if (this.parentElement && this.parentElement.className !== 'virtuallist-virtual-content') {
      eventbus.emit(EventBusEventsEnum.VIEW_CONNECTED, this);
    }
  }

  /**
   * 当元素从文档中移除时调用
   */
  disconnectedCallback() {
    // this.viewer?.dispatch({
    //   type: EpubElementEventType.disconnected,
    //   target: this,
    // });
  }

  /**
   * 每当元素被移动到新文档中时调用
   */
  adoptedCallback() {
    // console.log('adoptedCallback');
  }

  /**
   * 当元素的属性被更改时调用
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    switch (name) {
      case 'style':
        if (this.style.width) {
          const width = parseInt(this.style.width);
          if (width !== this.width) {
            this.width = width;
            eventbus.emit(EventBusEventsEnum.VIEW_SIZE_CHANGE);
          }
        }

        if (this.style.height) {
          const height = parseInt(this.style.height);
          if (height !== this.height) {
            this.height = height;
            eventbus.emit(EventBusEventsEnum.VIEW_SIZE_CHANGE);
          }
        }
        break;
      default:
        console.log(name, oldValue, newValue);
        break;
    }
  }

  /**
   * 重写a[href]的点击行为
   */
  private replaceLinks(content: DocumentFragment) {
    const links = content.querySelectorAll('a[href]') as unknown as HTMLAnchorElement[];
    if (!links.length) {
      return;
    }

    const replaceLink = function (link: HTMLAnchorElement) {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href.indexOf('mailto:') === 0) {
        return;
      }

      if (href.indexOf('://') > -1) {
        link.setAttribute('target', '_blank');
        return;
      }

      link.onclick = function (e) {
        e.preventDefault();
        eventbus.emit(EventBusEventsEnum.CONTENT_LINK_CLICKED, href);
      };
    }.bind(this);

    for (let i = 0; i < links.length; i++) {
      replaceLink(links[i]);
    }
  }

  setHead() {
    this.$head.innerHTML = `
    <style>
      :host {
        display: block;
        overflow: hidden;
      }

      epub-view-body {
        position: relative;  // offsetParent
      }

      body {
        ${this.getAttribute('body-style')}
      }
    </style>
  `;
  }

  setBody() {
    // 解析epub html内容
    const domparser = new DOMParser();
    const doc = domparser.parseFromString(this.epubEl.book.getSpineContent(this.href), 'text/html');
    this.$body.append(...Array.from(doc.children[0].children));

    const fragment = document.createDocumentFragment();
    fragment.append(this.$head, this.$body);

    // 重映射a[href]的点击事件
    this.replaceLinks(fragment);

    this.attachShadow({ mode: 'open' }).replaceChildren(fragment);
  }
}
