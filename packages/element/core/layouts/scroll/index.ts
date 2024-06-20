import ViewLayout from '../layout';

import { macroTask, isEmpty } from '../../../utils';
import EpubCFI from '../../epubcfi';

import type { EpubView } from '../../elements';
import type { ViewLayoutOptions } from '../layout';
import type { Spine } from '../../book';

export type ScrollViewLayoutOptions = ViewLayoutOptions;

export default class ScrollViewLayout extends ViewLayout {
  constructor(options: ScrollViewLayoutOptions) {
    super(options);

    // 样式
    this.setStyle();
  }

  setStyle() {
    this.$layoutWrapper.classList.add('epub-view-layout--scroll');
    const style = document.createElement('style');
    style.innerHTML = `
      .epub-view-layout--scroll {
        height: 100%;
        overflow: auto;
        position: relative;
      }

      .virtuallist-real-content {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
      }

      .virtuallist-virtual-content {
        width: 100%;
        height: 100%;
        overflow: auto;
      }
    `;
    this.$el.$head.append(style);
  }

  epubViewHtmlTemplate(spine: Spine) {
    return `<epub-view idref="${spine.idref}" href="${spine.href}" root="${this.$el.uuid}"></epub-view>`;
  }

  getRealContentViewsSlice(): [number, number] {
    let start = -1;
    let end = -1;

    const scrollTop = this.$layoutWrapper.scrollTop;
    const containerHeight = this.$layoutWrapper.clientHeight;
    const scrollHeight = this.$layoutWrapper.scrollHeight;

    const startPos = Math.max(scrollTop - containerHeight, 0); // 缓冲区
    const endPos = Math.min(scrollTop + containerHeight * 2, scrollHeight);

    let height = 0;

    for (let i = 0; i < this.viewsCache.length; i++) {
      const view = this.viewsCache[i] as EpubView;
      height += view.height;

      if (start == -1 && height > startPos) {
        start = i;
      }
      if (end == -1 && height > endPos) {
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
    this.$vContent!.style.height = this.computeViewsSize() + 'px';
  }

  computeViewsSize(end?: number) {
    return this.viewsCache.slice(0, typeof end === 'number' ? end : this.viewsCache.length).reduce((prev, next) => {
      return (prev += next.height);
    }, 0);
  }

  setRealContentTransform(transform: number) {
    this.$rContent!.style.transform = `translateY(${transform}px)`;
  }

  getCurrentViewIndex() {
    const wrap = this.virtual ? this.$rContent : this.$layoutWrapper;
    const views = Array.from(wrap!.children) as EpubView[];

    const containRect = this.$layoutWrapper.getBoundingClientRect();

    // 将当前视图内位于 1/3 位置的view认为是current focus view
    const focusPos = containRect.top + containRect.height / 3;

    let viewIndex = -1;
    for (let i = 0; i < views.length; i++) {
      const viewRect = views[i].getBoundingClientRect();
      if (viewRect.top + viewRect.height >= focusPos) {
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
        if (childRect.top + childRect.height >= focusPos) {
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
    // console.log(cfi.toString());

    return cfi;
  }

  _scrollTo(position: number): void {
    this.$layoutWrapper.scrollTo({
      top: position,
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

      macroTask(() => {
        // 当view渲染出来后，再次调整滚动高度
        const top = this.computeViewsSize(viewIndex);
        let offset = 0;
        if (!isEmpty(target.path)) {
          const el = this.getClosestElementFromCFI(view, target)!;
          offset = el.offsetTop;
        }
        this.toPosition({
          to: top + offset,
        });
      });
    } else {
      const el = this.getClosestElementFromCFI(view, target);
      this.toPosition({
        to: view.offsetTop + (el ? el.offsetTop : 0),
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

  // 连续滚动模式下切换页好像并没有多少意义
  nextPage(): void {
    const from = this.$layoutWrapper.scrollTop;
    const to = (Math.floor(from / this.$el.height) + 1) * this.$el.height;
    this.toPosition({
      to,
      from,
      smooth: true,
    });
  }

  prevPage(): void {
    const from = this.$layoutWrapper.scrollTop;
    const to = (Math.floor(from / this.$el.height) - 1) * this.$el.height;
    this.toPosition({
      to,
      from,
      smooth: true,
    });
  }
}
