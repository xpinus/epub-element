export enum EpubElementHookType {
  created = 'created', // 最早能获得book实例的时刻
  beforeRender = 'beforeRender', // 可以获得即将渲染的template
  rendered = 'rendered', // view的dom挂载结束
}

/**
 * @description epub-element view hook管理
 */
export class EpubElementHooks {
  hooks: Map<EpubElementHookType, Function> = new Map();

  on(type: EpubElementHookType, fn: Function) {
    this.hooks.set(type, fn);
  }

  off(type: EpubElementHookType) {
    this.hooks.delete(type);
  }

  async dispose(type: EpubElementHookType, value: any) {
    if (!this.hooks.has(type)) {
      return;
    }

    const fn = this.hooks.get(type);
    if (fn) {
      await Promise.resolve().then(() => fn(value));
    }
  }
}
