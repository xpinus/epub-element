import type { EpubElementInstanceType } from '../core/epub-element';
import * as globalState from '../core/state';

const CUSTOM_ELEMENT_NAME = 'epub-view';

/**
 * 自定义元素，表示 epub 文件
 * @description 通过自定义元素实现 epub 文件的渲染，实现样式隔离
 */
class EpubView extends HTMLElement {
  viewer: EpubElementInstanceType | undefined;

  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['href'];
  }

  /**
   * 当元素被添加到文档中时调用
   */
  async connectedCallback() {
    console.log('connectedCallback');
    // 想办法获取到 viewer 的实例
    const container = this.closest('.epub-viewer-container');
    if (!container) {
      throw new Error('can not find epub-viewer-container');
    }

    const uuid = container.getAttribute('data-uuid');
    if (!uuid || !globalState.instances.has(uuid)) {
      throw new Error('can not find epub-viewer-container with uuid:' + uuid);
    }

    this.viewer = globalState.instances.get(uuid);
    if (!this.viewer) {
      throw new Error('can not find epub-viewer-container with uuid:' + uuid);
    }

    const href = this.getAttribute('href');
    if (!href) {
      console.warn('no href for epub-view');
      return;
    }

    const template = document.createElement('template');
    template.innerHTML = await this.viewer.book.archive.getSpineHtml(href);
    const content = template.content.cloneNode(true) as HTMLElement;

    // 重映射a[href]的点击事件
    this.replaceLinks(content);

    // shadow dom
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(content);
  }

  /**
   * 当元素从文档中移除时调用
   */
  disconnectedCallback() {
    console.log('disconnectedCallback');
  }

  /**
   * 每当元素被移动到新文档中时调用
   */
  adoptedCallback() {
    console.log('adoptedCallback');
  }

  /**
   * 当元素的属性被更改时调用
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'href') {
      console.log(`href 属性的值从 ${oldValue} 变为 ${newValue}`);
    }
  }

  /**
   * 重写a[href]的点击行为
   */
  private replaceLinks(content: HTMLElement) {
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

      link.onclick = function () {
        // todo 实现cfi跳转
        console.log(href);
        return false;
      };
    }.bind(this);

    for (let i = 0; i < links.length; i++) {
      replaceLink(links[i]);
    }
  }
}

/**
 * 定义自定义元素
 */
function defineEpubViewElement() {
  !window.customElements.get(CUSTOM_ELEMENT_NAME) && window.customElements.define(CUSTOM_ELEMENT_NAME, EpubView);
}

export { defineEpubViewElement };
