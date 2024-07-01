import Plugin, { PluginOption } from './plugin';
import EpubCFI from '../core/epubcfi';
import { abortablePromiseFactory, AbortablePromise, createUUID } from '../utils';
import { Annotation, AnnotationType } from './annotate';

type SearchMatch = {
  range: Range;
  annoation: Annotation;
};

type SearchOptions = {
  type?: AnnotationType;
};

type SearchPluginOption = PluginOption & {
  autoJump?: boolean;
  activeColor?: string;
};

const DEFAULT_ACTIVE_COLOR = '#F8806280';

class Search extends Plugin {
  searchText: string = '';
  matchList: SearchMatch[] = [];
  current: SearchMatch | null = null;
  searchPromise: AbortablePromise | null = null;
  autoJump: boolean;
  activeColor: string;

  constructor(opt: SearchPluginOption) {
    const epubEl = opt.epubEl;
    super({ epubEl });

    this.autoJump = opt.autoJump || true;
    this.activeColor = opt.activeColor || DEFAULT_ACTIVE_COLOR;
  }

  beforePluginDestroy(): void {}

  // 搜索内容
  search(keyword: string, opt: SearchOptions = { type: AnnotationType.highlight }): Promise<SearchMatch[]> {
    this.cancelSearch(); // 停止正在进行的search
    this.clear();

    this.searchText = keyword;

    this.searchPromise = abortablePromiseFactory((resolve, reject) => {
      const resultMatchs: SearchMatch[] = [];

      const views = this._instance.rendition?.layout.viewsCache;
      if (!views || views.length === 0) {
        console.warn('no views found');
        resolve([]);
        return;
      }

      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        const walker = document.createTreeWalker(view.$body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const text = node.nodeValue || '';
          const regex = new RegExp(this.searchText, 'gi');

          let match;
          while ((match = regex.exec(text)) !== null) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);

            const annotation = new Annotation({
              hash: createUUID(),
              type: opt.type || AnnotationType.highlight,
              cfi: new EpubCFI(range, `/6/${(i + 1) * 2}`),
            });
            annotation.bind(view);

            const m: SearchMatch = {
              range,
              annoation: annotation,
            };

            resultMatchs.push(m);
          }
        }
      }

      resolve(resultMatchs);
    });

    return Promise.race([this.searchPromise]).then((result) => {
      this.matchList = result as SearchMatch[];
      this.renderMatch();

      if (this.autoJump && this.matchList?.length > 0) {
        this.jumpTo(this.matchList[0]);
      }

      return this.matchList;
    });
  }

  // 中断正在进行的search
  cancelSearch() {
    if (this.searchPromise) {
      this.searchPromise.abort();
      this.searchText = '';
    }
  }

  jumpTo(match: SearchMatch) {
    if (!this._instance.rendition) {
      console.error('jumpTo search match failed, rendition not exist');
      return;
    }
    this._instance.rendition.display(match.annoation.cfi);

    // current突出显示
    if (this.current) {
      this.current.annoation.mark.$group.removeAttribute('style');
    }
    this.current = match;
    this.current.annoation.mark.$group.style.setProperty('--mark-highlight-color', this.activeColor);
  }

  nextMatch() {
    if (this.matchList?.length === 0) {
      console.warn('no match found');
      return;
    }

    if (!this.current) {
      this.current = this.matchList[0];
    }

    const index = this.matchList.indexOf(this.current);
    let nextIndex = index + 1;
    if (nextIndex >= this.matchList.length) {
      nextIndex = 0;
    }
    this.jumpTo(this.matchList[nextIndex]);
  }

  prevMatch() {
    if (!this.current || this.matchList?.length === 0) {
      console.warn('no match found');
      return;
    }

    const index = this.matchList.indexOf(this.current);
    let prevIndex = index - 1;
    if (prevIndex < 0) {
      prevIndex = this.matchList.length - 1;
    }
    this.jumpTo(this.matchList[prevIndex]);
  }

  // 渲染匹配的结果
  renderMatch() {
    this.matchList.forEach((m) => {
      m.annoation.attach();
    });
  }

  // 清空搜索结果
  clear() {
    this.matchList.forEach((m) => {
      m.annoation.destroy();
    });
    this.matchList = [];
  }
}

Search.pluginName = 'search';

export default Search;
