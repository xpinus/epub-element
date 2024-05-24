import ViewManager from '../manager';
import eventbus, { EventBusEventsEnum } from '../../eventbus';
import { microTask, macroTask } from '../../../utils';
import EpubCFI from '../../epubcfi';

import type { EpubElelementContain, EpubView } from '../../elements';

type ContinuousViewManagerOptions = {
  viewer: EpubElelementContain;
  virtual?: boolean;
};

export default class ContinuousViewManager extends ViewManager {
  vContent: HTMLElement | null = null;
  rContent: HTMLElement | null = null;

  constructor(options: ContinuousViewManagerOptions) {
    super(options);

    // 样式
    this.$layoutWrapper.classList.add('epub-viewer-continuous');
    const style = document.createElement('style');
    style.innerHTML = `
      .epub-viewer-continuous {
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
    this.viewer.$head.append(style);
  }

  render() {
    if (!this.viewer.book) {
      throw new Error("epub's book not found");
    }

    console.log('virtual', this.virtual);

    if (this.virtual) {
      // 虚拟列表
      this.vContent = document.createElement('div'); // 虚拟内容区
      this.vContent.className = 'virtuallist-virtual-content';
      this.rContent = document.createElement('div'); // 真实内容区
      this.rContent.className = 'virtuallist-real-content';

      this.$layoutWrapper.append(this.vContent, this.rContent);

      // 加载但不渲染，获得真实的高度给vContent (不一定准确)
      // https://juejin.cn/post/6999419106097102879
      this.insertViews(this.vContent);

      microTask(() => {
        this.updateVirtualContentHeight();
        this.vContent!.innerHTML = '';
        this.setContent();
      });

      this.$layoutWrapper.addEventListener('scroll', () => {
        this.setContent();
      });

      eventbus.on(EventBusEventsEnum.VIEW_SIZE_CHANGE, () => {
        this.updateVirtualContentHeight();
      });
    } else {
      this.insertViews(this.$layoutWrapper);
    }

    // 当前的进度
    // this.location.test();
  }

  /**
   * @description （虚拟列表）当前需要渲染的内容跨度
   * @returns [start, end] viewsCache中的索引范围
   */
  getSlice(): [number, number] {
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
      this.updateVirtualContentHeight();
    }

    return [start, end];
  }

  /**
   * @description （虚拟列表）设置虚拟列表的实际内容
   */
  setContent() {
    this.rContent!.innerHTML = '';

    const [start, end] = this.getSlice();
    const renderList = this.viewsCache.slice(start, end + 1);
    this.rContent!.append(...renderList);

    const transformY = this.viewsCache.slice(0, start).reduce((prev, next) => {
      return (prev += next.height);
    }, 0);
    this.rContent!.style.transform = `translateY(${transformY}px)`;
  }

  /**
   * @description 更新设置虚拟内容高度（虚拟列表）
   */
  updateVirtualContentHeight() {
    this.vContent!.style.height = this.computeViewsSize() + 'px';
  }

  computeViewsSize(end?: number) {
    return this.viewsCache.slice(0, end || this.viewsCache.length).reduce((prev, next) => {
      return (prev += next.height);
    }, 0);
  }

  /**
   * @description 显示EpubCFI位置的页面
   */
  display(target: EpubCFI) {
    const topViewIndex = target.base!.steps[1].index;
    const view = this.viewsCache[topViewIndex];

    if (this.virtual) {
      this.$layoutWrapper.scrollTo({
        top: this.computeViewsSize(topViewIndex),
      });

      macroTask(() => {
        // 当view渲染出来后，再次调整滚动高度
        const top = this.computeViewsSize(topViewIndex);
        let offset = 0;
        if (target.path) {
          const el = this.location.getClosestElementFromCFI(view, target);
          offset = el.offsetTop; // epub-view-body被设置为offsetParent
        }
        this.$layoutWrapper.scrollTo({
          top: top + offset,
        });
      });
    } else {
      const el = this.location.getClosestElementFromCFI(view, target);
      this.$layoutWrapper.scrollTo({
        top: view.offsetTop + el.offsetTop,
      });
    }
  }

  set percent(percent: number) {
    this.$layoutWrapper.scrollTo({
      top: this.$layoutWrapper.scrollHeight * percent,
    });

    this.location.percent = percent;
  }

  getCurrentCFI() {
    const wrap = this.virtual ? this.rContent : this.$layoutWrapper;
    const views = Array.from(wrap!.children) as EpubView[];

    const containRect = this.$layoutWrapper.getBoundingClientRect();

    // 将当前视图内位于 1/3 位置的view认为是current focus view
    const focusPos = containRect.top + containRect.height / 3;

    for (let i = 0; i < views.length; i++) {
      const viewRect = views[i].getBoundingClientRect();
      if (viewRect.top + viewRect.height >= focusPos) {
        const view = views[i];
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

        let spineIndex: number;
        if (this.virtual) {
          spineIndex = this.viewsCache.indexOf(view);
        } else {
          spineIndex = i;
        }

        const cfi = new EpubCFI(target, `/6/${(spineIndex + 1) * 2}`);
        console.log(cfi.toString());

        return cfi;
      }
    }

    throw new Error('not found');
  }
}
