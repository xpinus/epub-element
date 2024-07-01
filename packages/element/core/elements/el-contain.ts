import CustomElement from './customEl';
import EpubElement from '../epub-element';

import type { EpubElementInstanceType } from '../epub-element';

export default class EpubElelementContain extends CustomElement {
  $head: HTMLElement;
  $container: HTMLElement;
  uuid: string = '';
  _instance: EpubElementInstanceType | null = null;

  static get observedAttributes() {
    return ['uuid'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    switch (name) {
      case 'uuid':
        this.uuid = newValue;
        if (!EpubElement.hasInstance(this.uuid)) {
          throw new Error('no epub element with uuid: ' + this.uuid);
        }
        this._instance = EpubElement.getInstance(this.uuid)!;
        break;
    }
  }

  constructor() {
    super();
    this._create();
    this.$head = this.shadowRoot!.querySelector('epub-element-head')!;
    this.$container = this.shadowRoot!.querySelector('.epub-viewer-container')!;
  }

  connectedCallback() {
    // 渲染
    this._instance!.rendition!.render();
  }

  _create() {
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
}
