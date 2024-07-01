export default class CustomElement extends HTMLElement {
  _width: number = 0;
  _height: number = 0;

  constructor() {
    super();
  }

  /**
   * @description 获取元素的宽高
   */
  get width() {
    const width = this.getBoundingClientRect().width;
    if (width) {
      this._width = width;
    }

    return this._width;
  }

  get height() {
    const height = this.getBoundingClientRect().height;
    if (height) {
      this._height = height;
    }
    return this._height;
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
