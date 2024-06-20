import EpubView from './el-view';
import EpubElelementContain from './el-contain';

/**
 * @description 注册自定义元素
 */
export function defineEpubViewElement() {
  if (customElements.get('epub-view') === undefined) {
    customElements.define('epub-view', EpubView);
  }

  if (customElements.get('epub-contain') === undefined) {
    customElements.define('epub-element', EpubElelementContain);
  }
}
