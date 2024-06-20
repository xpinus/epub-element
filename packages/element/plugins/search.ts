import Plugin, { PluginOption } from './plugin';

import type { EpubElementInstanceType } from '../core/epub-element';

export default class Search extends Plugin {
  constructor(opt: PluginOption) {
    const epubEl = opt.epubEl;
    super({ epubEl }, 'search');
  }

  beforePluginDestroy(): void {}
}
