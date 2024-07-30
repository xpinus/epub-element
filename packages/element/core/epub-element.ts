import Book from './book';
import { defineEpubViewElement } from './elements';
import { createUUID, isBoolean } from '../utils';
import Rendition from './rendition';
import { LayoutMode } from './layouts';
import EventBus, { EventBusEventsEnum } from './eventbus';
import PluginsManager from '../plugins/manager';
import { GlobalStore } from './store';

import type { EpubElelementContain } from './elements';
import type { RenditionOptions } from './rendition';
import type { EpubViewHooks } from './elements/el-view';
import type Plugin from '../plugins/plugin';
import type { PluginClass } from '../plugins/plugin';

export type EpubElementInstanceType = InstanceType<typeof EpubElement>;

type PluginUseOption = string | string[] | { name: string; [prop: string]: any }[];

type EpubElementMountOptions = RenditionOptions & {
  class?: string;
  plugins?: PluginUseOption;
};

/**
 * @description 一切的开始 entry
 */
class EpubElement {
  public uuid: string = createUUID();
  public book: Book = new Book();
  public event: EventBus = new EventBus();

  public $el: EpubElelementContain | null = null;
  public rendition: Rendition | null = null;
  public hooks: EpubViewHooks = {};
  public plugins: { [name: string]: Plugin } = {};

  constructor() {
    GlobalStore.setInstance(this.uuid, this);
  }

  /**
   * 请求epub文件，创建EpubElement, 解析文件信息和各个文件
   * @param url epub文件路径
   */
  static openEpub(url: string) {
    const _instance = new EpubElement();

    return new Promise((resolve, reject) => {
      _instance.book
        .open(url)
        .then(() => {
          resolve(_instance);

          defineEpubViewElement();
        })
        .catch(reject);
    });
  }

  /**
   * 构造并渲染元素
   */
  mount(el: HTMLElement, options: EpubElementMountOptions) {
    console.log(options);

    if (!(el instanceof HTMLElement)) {
      throw new Error('el must be HTMLElement for Epub to mount');
    }

    const element = document.createElement('epub-element') as EpubElelementContain;
    element.setAttribute('uuid', this.uuid);
    this.$el = element;

    this.rendition = new Rendition({
      epubEL: this,
      layout: options.layout || LayoutMode.Scroll,
      virtual: isBoolean(options.virtual) ? options.virtual : true,
      spread: isBoolean(options.spread) ? options.spread : false,
      // orientation: options.orientation,
    });

    el.replaceWith(this.$el);

    // 初始化插件
    if (options.plugins) {
      this.usePlugin(options.plugins);
    }

    (window as any).epub = this;
  }

  /**
   * 使用插件
   */
  usePlugin(opt: PluginUseOption) {
    if (typeof opt === 'string') {
      this.addPlugin(opt);
    } else if (Array.isArray(opt)) {
      for (let i = 0; i < opt.length; i++) {
        const p = opt[i];
        if (typeof p === 'string') this.addPlugin(p);
        else if (typeof p === 'object' && p.name) {
          this.addPlugin(p.name, p);
        } else {
          console.warn('无效的插件配置：', p);
        }
      }
    }
  }

  addPlugin(pluginName: string, opt?: { [prop: string]: any }) {
    if (!PluginsManager.has(pluginName)) {
      throw new Error('usePlugin: no exist plugin with name ' + pluginName);
    }

    this.plugins[pluginName] = PluginsManager.create(pluginName, {
      epubEl: this,
      ...opt,
    });
  }

  /**
   * 注册自定义插件
   */
  static registerPlugin(name: string, PluginClass: PluginClass) {
    if (PluginsManager.has(name)) {
      console.warn(name + ' existed !');
      return;
    }

    PluginsManager.set(name, PluginClass);
  }

  /**
   * 销毁实例
   */
  destroy() {
    GlobalStore.removeInstance(this.uuid);
  }
}

const EpubElementProxy = new Proxy(EpubElement, {
  construct: function () {
    throw new Error('EpubElement cannot be instantiated directly, use EpubElement.openEpub instead');
  },
});

export default EpubElementProxy;
