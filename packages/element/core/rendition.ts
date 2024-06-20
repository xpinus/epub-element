import { LayoutMode, ScrollViewLayout, PaginatedViewLayout } from './layouts';
import { isCFIString } from '../utils';
import EpubCFI from './epubcfi';
import Annotations from './annotations';
import { EventBusEventsEnum } from './eventbus';

import type { EpubElementInstanceType } from './epub-element';
import type { ViewLayout, ScrollViewLayoutOptions, PaginatedViewLayoutOptions } from './layouts';

type GetLayoutOptions = ScrollViewLayoutOptions &
  PaginatedViewLayoutOptions & {
    layout: LayoutMode;
  };

export type RenditionOptions = GetLayoutOptions;

class Rendition {
  _instance: EpubElementInstanceType;
  layout: ViewLayout;
  annotations: Annotations;

  constructor(options: RenditionOptions) {
    this._instance = options.epubEL;

    this.layout = this.getLayout(options);
    this.annotations = new Annotations(this);

    this._instance.event.on(EventBusEventsEnum.CONTENT_LINK_CLICKED, (href: string) => {
      this.display(href);
    });
  }

  render() {
    this.layout.render();
  }

  /**
   * @description 显示指定的页面
   * @param target spine href | epubcfi (EpubCFI) | percentage[0-1]
   */
  display(target: string | number | EpubCFI) {
    // 参数标准化，统一转换为EpubCFI
    let cfi: EpubCFI | null = null;

    if (typeof target === 'string') {
      if (isCFIString(target)) {
        // 传入的是epubcfi字符串
        cfi = new EpubCFI(target);
      } else {
        // 传入的是spine href
        cfi = this.convertHrefToCfi(target);
      }
    } else if (!isNaN(Number(target))) {
      // 百分比
      const percent = Number(target);
      if (percent > 0 && percent < 1) {
        this.layout.percent = percent;
        return;
      }
    } else if (target instanceof EpubCFI) {
      // EpubCFI对象实例
      cfi = target;
    }

    if (!cfi || !(cfi instanceof EpubCFI)) {
      throw new Error('invalid target: ' + target);
    }

    this.layout.display(cfi);
  }

  /**
   * @description 将内容中的spine链接转换为epubcfi
   */
  convertHrefToCfi(href: string) {
    const reg = new RegExp(/^\/?(.*\.html)(#.*)$/);

    const m = href.match(reg);
    if (!m || m.length < 2) {
      throw new Error('invalid href: ' + href);
    }

    const chapter = m[1];
    const contentPos = m[2];

    const viewIndex = this.layout.viewsCache.findIndex((view) => view.href === chapter);
    if (viewIndex === -1) {
      throw new Error('view not found: ' + href);
    }
    const view = this.layout.viewsCache[viewIndex];

    let targetNode: HTMLElement;
    if (contentPos) {
      targetNode = view.shadowRoot!.querySelector(contentPos)!;
    } else {
      targetNode = view.shadowRoot!.children[0] as HTMLElement;
    }

    // console.log(chapter, contentPos, view, targetNode);

    return new EpubCFI(targetNode, `/6/${(viewIndex + 1) * 2}`);
  }

  /**
   * @description 根据设置，获取对应的manager
   */
  getLayout({ epubEL, layout = LayoutMode.Scroll, virtual = true }: GetLayoutOptions): ViewLayout {
    let _layout: ViewLayout;

    switch (layout) {
      case LayoutMode.Scroll:
        _layout = new ScrollViewLayout({
          epubEL,
          virtual,
        });
        break;
      case LayoutMode.Paginated:
        _layout = new PaginatedViewLayout({
          epubEL,
          virtual,
        });
        break;
      default:
        throw new Error('readmode not found');
    }

    return _layout;
  }
}

export default Rendition;
