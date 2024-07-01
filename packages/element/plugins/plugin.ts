import EpubElement from '../core/epub-element';

import type { EpubElementInstanceType } from '../core/epub-element';

export type PluginOption = {
  epubEl: EpubElementInstanceType;
  [property: string]: any;
};

export interface PluginClass {
  new (opt: PluginOption): Plugin;
}

/**
 * @description 插件模板接口
 */
abstract class Plugin {
  _instance: EpubElementInstanceType; // epub-element实例

  public static pluginName: string;

  constructor(opt: PluginOption) {
    this._instance = opt.epubEl;
  }

  abstract beforePluginDestroy(): void;
}

export default Plugin;
