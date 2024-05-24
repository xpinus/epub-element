import Location from '../location';
import { isBoolean } from '../../utils';
import EpubCFI from '../epubcfi';

import type EpubElelementContain from '../elements/el-contain';
import type EpubView from '../elements/el-view';

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

export default abstract class ViewManager {
  viewsCache: EpubView[] = []; // 已经渲染的视图的缓存
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

  /**
   * @description 渲染
   */
  abstract render(): void;

  /**
   * @description 计算视图的尺寸
   */
  abstract computeViewsSize(end?: number): number;

  /**
   * @description 显示指定的页面
   */
  abstract display(target: EpubCFI): void;

  /**
   * @description 插入所有的view
   */
  insertViews(wrapper: HTMLElement) {
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

    wrapper.append(...Array.from(fragment.children));
    this.viewsCache = Array.from(wrapper.children) as EpubView[];
    // this.viewsCache.forEach((view) => {
    //   this.intersectionObserver.observe(view);
    // });
  }

  /**
   * @description 监听view进入视图
   */
  onViewIntersect(entries: IntersectionObserverEntry[]) {
    console.log(entries);
    this.currentViews = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target) as EpubView[];
  }

  destroy() {
    this.intersectionObserver.disconnect();
  }

  get percent() {
    return this.location.percent;
  }

  set percent(percent: number) {
    console.warn('manager shuold implement percent set');
  }

  /**
   * @description 根据指定的element获取对应的EpubCFI
   */
  getCFIFromElement(el: HTMLElement) {
    const root = el.getRootNode() as ShadowRoot;
    const view = root.host as EpubView;
    const viewIndex = this.viewsCache.indexOf(view);

    return new EpubCFI(el, `/6/${(viewIndex + 1) * 2}`);
  }

  /**
   * @description 获取当前可视区域的EpubCFI
   */
  abstract getCurrentCFI(): EpubCFI;
}
