import CustomElement from './customEl';
import { EventBusEventsEnum } from '../eventbus';
import { MarkStage, Highlight, Underline } from 'mark-stage';
import { Annotation, AnnotationType } from '../../plugins/annotate';
import { GlobalStore } from '../store';
import { macroTask } from '../../utils';

import type { EpubElementInstanceType } from '../epub-element';

enum EpubViewHooksType {
  content = 'content', // 当view内容被解析时调用
  created = 'created', // 当view被添加到文档中时调用
  connected = 'connected', // 当view被添加到文档中时调用
  disconnected = 'disconnected', // 当view从文档中移除时调用
}

export type EpubViewHooks = {
  [EpubViewHooksType.content]?: (doc: Document, xml: string, view: EpubView) => void;
  [EpubViewHooksType.created]?: (view: EpubView) => void;
  [EpubViewHooksType.connected]?: (view: EpubView) => void;
  [EpubViewHooksType.disconnected]?: (view: EpubView) => void;
};

/**
 * @description web component实现 epub 文件具体页面内容的渲染，以及样式隔离
 */
export default class EpubView extends CustomElement {
  href: string;
  _instance: EpubElementInstanceType;
  hooks: EpubViewHooks;
  $head: HTMLElement;
  $body: HTMLElement;
  connected: boolean = false;
  stage: MarkStage | undefined;

  static get observedAttributes() {
    return ['style'];
  }

  constructor() {
    super();

    const rootUUID = this.getAttribute('root')!;
    const epubElementInstance = GlobalStore.getInstance(rootUUID);
    if (!epubElementInstance) {
      throw new Error('no root for epub-view: ' + rootUUID);
    }
    this._instance = epubElementInstance;
    this.hooks = this._instance.hooks;

    this.href = this.getAttribute('href')!;
    if (!this.href) {
      throw new Error('no href for epub-view');
    }

    this.$head = document.createElement('epub-view-head');
    this.$body = document.createElement('epub-view-body');

    this._create();

    if (this.hooks.created) {
      this.hooks.created(this);
    }
  }

  /**
   * 当元素被添加到文档中时调用
   */
  async connectedCallback() {
    if (this.parentElement && this.parentElement.className !== 'virtuallist-virtual-content') {
      this._instance.event.emit(EventBusEventsEnum.VIEW_CONNECTED, this);
    }

    if (this.hooks.connected) {
      this.hooks.connected(this);
    }

    if (this.stage) {
      macroTask(() => {
        this.stage!.render();
      });
    }
    this.connected = true;

    this.dispatch('connected');
  }

  /**
   * 当元素从文档中移除时调用
   */
  disconnectedCallback() {
    if (this.hooks.disconnected) {
      this.hooks.disconnected(this);
    }

    this.connected = false;
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
        if (this.style.width || this.style.height) {
          this._instance.event.emit(EventBusEventsEnum.VIEW_SIZE_CHANGE);
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
    const that = this;

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
        that._instance.event.emit(EventBusEventsEnum.CONTENT_LINK_CLICKED, href);
      };
    }.bind(this);

    for (let i = 0; i < links.length; i++) {
      replaceLink(links[i]);
    }
  }

  _create() {
    this.setHead();

    // 解析epub html内容
    const domparser = new DOMParser();
    const contentHtml = this._instance.book.getSpineContent(this.href);
    const doc = domparser.parseFromString(contentHtml, 'text/html');

    if (this.hooks.content) {
      this.hooks.content(doc, contentHtml, this);
    }

    this.$body.append(...Array.from(doc.children[0].children));

    const fragment = document.createDocumentFragment();
    fragment.append(this.$head, this.$body);

    // 重映射a[href]的点击事件
    this.replaceLinks(fragment);

    this.attachShadow({ mode: 'open' }).replaceChildren(fragment);
  }

  setHead() {
    this.$head.innerHTML = `
    <style>
      :host {
        display: block;
        overflow: hidden;
      }

      epub-view-body {
        display: block;
        position: relative;  // offsetParent
      }

      body {
        ${this.getAttribute('body-style')}
      }
    </style>
  `;
  }

  addAnnotation(annot: Annotation) {
    if (!this.stage) {
      const target: HTMLElement = this.$body.querySelector('body') || this.$body;

      this.stage = new MarkStage(target, this.$body);
    }

    if (this.stage.marks.has(annot.hash)) return;

    let mark;
    switch (annot.type) {
      case AnnotationType.highlight:
        mark = this.stage.add(
          new Highlight({
            uuid: annot.hash,
            range: annot.cfi.toRange(),
            classList: annot.classList,
          }),
        );
        break;
      case AnnotationType.underline:
        mark = this.stage.add(
          new Underline({
            uuid: annot.hash,
            range: annot.cfi.toRange(),
            classList: annot.classList,
          }),
        );
        break;
      default:
        console.warn('not support annotate type: ', annot.type);
        break;
    }

    annot.mark = mark as any;
  }

  removeAnnotation(uuid: string) {
    if (this.stage) {
      this.stage.remove(uuid);
    }
  }
}
