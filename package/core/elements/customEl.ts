import { EpubEventOptions } from './event';

export default class CustomElement extends HTMLElement {
  width: number = 0;
  height: number = 0;

  constructor() {
    super();
  }

  /**
   * @description 设置元素的宽高
   */
  setRect() {
    const rect = this.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    return rect;
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

  /**
   * @description 设置style样式
   */
  css(styles: { [key: string]: string }) {
    Object.entries(styles).forEach(([key, value]) => {
      this.style.setProperty(key, value);
    });
  }
}
