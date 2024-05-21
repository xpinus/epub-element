import Location from '../location';
import { isBoolean } from '../../utils';

import type EpubElelementContain from '../elements/el-contain';
import type EpubView from '../elements/el-view';
import type EpubCFI from '../epubcfi';

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

export default class ViewManager {
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
  render() {
    console.warn('ViewManager need implement render');
  }

  /**
   * @description 显示指定的页面
   */
  display(target: EpubCFI) {
    console.warn('ViewManager need implement display: ', target);
  }

  /**
   * @description 插入所有的view
   * @param wrapper view的容器
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
  }

  /**
   * @description 监听view进入视图
   * @param entries
   */
  onViewIntersect(entries: IntersectionObserverEntry[]) {
    console.log(entries);
  }

  destroy() {
    this.intersectionObserver.disconnect();
  }
}
