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
   * @description 触发自定义事件
   */
  dispatch(type: string, value?: any, target = this) {
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
