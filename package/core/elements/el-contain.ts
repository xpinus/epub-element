import { EpubEventOptions } from './event';
import Rendition from '../rendition';
import { ManagerOrientation, ManagerReadMode } from '../managers/manager';

import type Book from '../book';

export default class EpubElelementContain extends HTMLElement {
  $head: HTMLElement;
  $container: HTMLElement;
  width: number = 0;
  height: number = 0;
  uuid: string = '';
  book: Book | null = null;
  rendition: Rendition;

  static get observedAttributes() {
    return ['uuid'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    switch (name) {
      case 'uuid':
        this.uuid = newValue;
        break;
    }
  }

  constructor() {
    super();
    this._render();
    this.$head = this.shadowRoot!.querySelector('epub-element-head')!;
    this.$container = this.shadowRoot!.querySelector('.epub-viewer-container')!;

    this.rendition = new Rendition({
      viewer: this,
      orientation: ManagerOrientation.Portrait,
      readmode: ManagerReadMode.Continuous,
      virtual: true,
    });
  }

  connectedCallback() {
    const rect = this.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.rendition.render();
  }

  _render() {
    const html = `
      <epub-element-head>
        <style>
          .epub-viewer-container {
            width: 100%;
            height: 100%;
          }

          @supports selector(::-webkit-scrollbar) {
            *::-webkit-scrollbar {
              width: 4px;
              height: 4px;
            }

            *::-webkit-scrollbar-thumb {
              background: #c9cdd4;
              border-radius: 5px;
            }
          }

          @supports not (selector(::-webkit-scrollbar)) {
            * {
              scrollbar-width: thin;
              scrollbar-color: #c9cdd4 #c9cdd4;
            }
          }
        </style>
      </epub-element-head>
      <div class="epub-viewer-container"></div>
    `;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
  }

  /**
   * @description 触发事件
   * @param target 目标元素
   * @param eventtype 事件类型
   * @param detail 传递的数据
   */
  dispatch({ type, target = this, value }: EpubEventOptions) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        detail: {
          target,
          value,
        },
      }),
    );
  }
}
