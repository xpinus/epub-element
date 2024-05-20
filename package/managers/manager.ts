import Location from '../location';
import { isBoolean } from '../utils';
import type EpubElelementContain from '../core/elements/el-contain';
import type EpubView from '../core/elements/el-view';

export enum ManagerOrientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

export enum ManagerReadMode {
  Continuous = 'continuous',
  Pagination = 'pagination',
}

type ViewManagerOptions = {
  viewer: EpubElelementContain;
  virtual?: boolean;
};

type ViewRect = {
  width: number;
  height: number;
};

export default class ViewManager {
  viewsCache: Map<string, EpubView> = new Map(); // 已经渲染的视图的缓存
  viewsRect: ViewRect[] = []; // 已渲染视图的大小（高或宽）
  currentViews: EpubView[] = []; // 当前渲染的视图
  viewer: EpubElelementContain;
  $layoutWrapper: HTMLDivElement;
  intersectionObserver: IntersectionObserver;
  location: Location = new Location();
  virtual: boolean = true;

  constructor(options: ViewManagerOptions) {
    this.viewer = options.viewer;
    this.virtual = isBoolean(options.virtual) ? options.virtual! : true;

    const layoutWrapper = document.createElement('div');
    layoutWrapper.className = 'epub-viewer-layout';
    this.$layoutWrapper = layoutWrapper;
    this.viewer.$container.append(layoutWrapper);

    this.intersectionObserver = new IntersectionObserver(this.onViewIntersect.bind(this));
  }

  render() {
    console.warn('ViewManager render');
  }

  renderFullSpine() {
    if (!this.viewer.book) {
      throw new Error("epub's book not found");
    }

    const book = this.viewer.book;
    const fragment = document.createElement('div');
    const spineHtml = `
      ${book.spine
        .map((item) => {
          return `<epub-view idref="${item.idref}" href="${item.href}" root="${this.viewer.uuid}"></epub-view>`;
        })
        .join('')}
    `;
    fragment.innerHTML = spineHtml;

    this.$layoutWrapper.append(...Array.from(fragment.children));
  }

  onViewIntersect(entries: IntersectionObserverEntry[]) {
    console.log(entries);
  }

  destroy() {
    this.intersectionObserver.disconnect();
  }
}
