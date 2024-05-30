import ViewLayout from '../layout';
import eventbus, { EventBusEventsEnum } from '../../eventbus';
import { microTask, macroTask, isEmpty } from '../../../utils';
import EpubCFI from '../../epubcfi';

import type { EpubView } from '../../elements';
import type { ViewLayoutOptions } from '../layout';
import type { Spine } from '../../book';

export type PaginatedViewLayoutOptions = ViewLayoutOptions;

const GAP = 16; // 间隔

export default class PaginatedViewLayout extends ViewLayout {
  constructor(options: PaginatedViewLayoutOptions) {
    super(options);

    // 样式
    this.setStyle();

    this.handleKeyboard = this.handleKeyboard.bind(this);
    this.bindEvents();
  }

  setStyle() {
    this.$layoutWrapper.classList.add('epub-view-layout--paginated');
    const style = document.createElement('style');
    style.innerHTML = `
      .epub-view-layout--paginated {
        height: 100%;
        overflow: hidden;
        position: relative;
      }

      .virtuallist-real-content {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        display: flex;
      }

      .virtuallist-virtual-content {
        width: 100%;
        height: 100%;
        overflow: auto;
        display: flex;
      }
    `;
    this.viewer.$head.append(style);
  }

  epubViewHtmlTemplate(spine: Spine) {
    const attrs = {
      style: 'flex-shrink: 0;',
      'body-style': `
      column-fill: auto;
      column-gap: ${GAP * 2}px;
      column-width: ${this.viewer.width}px;
      width: ${this.viewer.width}px;
      height: ${this.viewer.height}px;
      padding-top: 20px !important;
      padding-bottom: 20px !important;
      padding-left: ${GAP}px !important;
      padding-right: ${GAP}px !important;
      box-sizing: border-box;
      margin: 0 !important;
      `,
    };

    const attrStr = Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    return `<epub-view idref="${spine.idref}" href="${spine.href}" root="${this.viewer.uuid}" ${attrStr}></epub-view>`;
  }

  getRealContentViewsSlice(): [number, number] {
    let start = -1;
    let end = -1;

    const scrollLeft = this.$layoutWrapper.scrollLeft;
    const containerWidth = this.$layoutWrapper.clientWidth;
    const scrollWidth = this.$layoutWrapper.scrollWidth;

    const startPos = Math.max(scrollLeft - containerWidth, 0); // 缓冲区
    const endPos = Math.min(scrollLeft + containerWidth * 2, scrollWidth);

    let width = 0;

    for (let i = 0; i < this.viewsCache.length; i++) {
      const view = this.viewsCache[i] as EpubView;
      width += view.width;

      if (start == -1 && width > startPos) {
        start = i;
      }
      if (end == -1 && width > endPos) {
        end = i;
      }
      if (start != -1 && end != -1) {
        break;
      }
    }

    if (start > end) {
      // 初始高度计算误差需要更新
      end = this.viewsCache.length - 1;
      this.updateVirtualContent();
    }

    return [start, end];
  }

  updateVirtualContent() {
    this.$vContent!.style.width = this.computeViewsSize() + 'px';
  }

  computeViewsSize(end?: number) {
    return this.viewsCache.slice(0, typeof end === 'number' ? end : this.viewsCache.length).reduce((prev, next) => {
      return (prev += next.width);
    }, 0);
  }

  setRealContentTransform(transform: number) {
    this.$rContent!.style.transform = `translateX(${transform}px)`;
  }

  getCurrentViewIndex() {
    const wrap = this.virtual ? this.$rContent : this.$layoutWrapper;
    const views = Array.from(wrap!.children) as EpubView[];

    const containRect = this.$layoutWrapper.getBoundingClientRect();
    const focusPos = containRect.left;

    let viewIndex = -1;
    for (let i = 0; i < views.length; i++) {
      const viewRect = views[i].getBoundingClientRect();
      if (viewRect.left + viewRect.width > focusPos) {
        viewIndex = i;
        break;
      }
    }

    if (viewIndex < 0) {
      throw new Error('not found current view');
    }

    if (this.virtual) {
      viewIndex = this.viewsCache.indexOf(views[viewIndex]);
    }

    return { view: this.viewsCache[viewIndex], viewIndex, focusPos };
  }

  getCurrentCFI() {
    const { view, viewIndex, focusPos } = this.getCurrentViewIndex();

    let target: HTMLElement = view.$body.querySelector('body') || view.$body;

    const findFocusElement = (focus: HTMLElement): any => {
      const children = Array.from(focus.children) as HTMLElement[];

      for (let j = 0; j < children.length; j++) {
        const childRect = children[j].getBoundingClientRect();
        if (childRect.left >= focusPos) {
          if (children[j].children.length) {
            return findFocusElement(children[j])!;
          }

          return children[j];
        }
      }

      return focus;
    };

    target = findFocusElement(target);

    const cfi = new EpubCFI(target, `/6/${(viewIndex + 1) * 2}`);
    console.log(cfi.toString());

    return cfi;
  }

  _scrollTo(position: number): void {
    this.$layoutWrapper.scrollTo({
      left: position,
    });
  }

  /**
   * @description 显示EpubCFI位置的页面
   */
  display(target: EpubCFI) {
    const viewIndex = target.base!.steps[1].index;
    const view = this.viewsCache[viewIndex];

    if (this.virtual) {
      this.toPosition({
        to: this.computeViewsSize(viewIndex),
      });

      setTimeout(() => {
        // 当view渲染出来后，再次调整滚动高度
        const left = this.computeViewsSize(viewIndex);
        let offset = 0;
        if (!isEmpty(target.path)) {
          const el = this.getClosestElementFromCFI(view, target)!;
          offset = Math.floor(el.offsetLeft / this.viewer.width) * this.viewer.width;
        }

        this.toPosition({
          to: left + offset,
        });
      }, 20);
    } else {
      const el = this.getClosestElementFromCFI(view, target);
      this.toPosition({
        to: view.offsetLeft + (el ? el.offsetLeft : 0),
      });
    }
  }

  set percent(percent: number) {
    if (this.virtual) {
      console.warn('virtual layout not support  percent for now');
      return;
    }

    this.toPosition({
      to: this.$layoutWrapper.scrollHeight * percent,
    });

    this._percent = percent;
  }

  nextPage() {
    const from = this.$layoutWrapper.scrollLeft;
    const to = from + this.viewer.width;
    this.toPosition({
      from,
      to,
      smooth: true,
    });
  }

  prevPage() {
    const from = this.$layoutWrapper.scrollLeft;
    const to = from - this.viewer.width;
    this.toPosition({
      from,
      to,
      smooth: true,
    });
  }

  prevView() {
    const { viewIndex } = this.getCurrentViewIndex();

    const spineIndex = viewIndex - 1;
    if (spineIndex < 0) {
      return;
    }
    const epubCfi = `epubcfi(/6/${(spineIndex + 1) * 2}!)`;

    this.display(new EpubCFI(epubCfi));
  }

  /**
   * @description 处理键盘事件
   */
  handleKeyboard(e: KeyboardEvent) {
    // 监听右方向键->，下一页
    if (e.key === 'ArrowRight') {
      this.nextPage();
    }

    // 监听左方向键<-，上一页
    if (e.key === 'ArrowLeft') {
      this.prevPage();
    }
  }

  /**
   * @description 绑定事件
   */
  bindEvents() {
    eventbus.on(EventBusEventsEnum.VIEW_CONNECTED, (view: EpubView) => {
      const scrollWidth = view.$body.querySelector('body')?.scrollWidth || 0;
      const width = scrollWidth > this.viewer.width ? scrollWidth + 16 : this.viewer.width;
      view.css({
        width: width + 'px',
      });
    });

    document.body.addEventListener('keydown', this.handleKeyboard);
  }

  /**
   * @description 解绑事件
   */
  unbindEvents() {
    eventbus.off(EventBusEventsEnum.VIEW_CONNECTED);

    document.body.removeEventListener('keydown', this.handleKeyboard);
  }
}
