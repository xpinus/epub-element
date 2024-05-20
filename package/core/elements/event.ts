/**
 * @description 自定义元素的自定义事件类型
 */
export enum EpubElementEventType {
  created = 'created', // 最早能获得book实例的时刻
  beforeRender = 'beforeRender', // 可以获得即将渲染的template
  rendered = 'rendered', // view的dom挂载结束
}

export type EpubEventOptions = {
  type: EpubElementEventType;
  target?: HTMLElement;
  value?: any;
};
