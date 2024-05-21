import ViewManager from '../manager';
import eventbus, { EventBusEventsEnum } from '../../eventbus';
import { microTask, macroTask } from '../../../utils';

import type { EpubElelementContain, EpubView } from '../../elements';
import type EpubCFI from '@/core/epubcfi';

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
        this.viewsCache = Array.from(this.vContent!.children) as EpubView[];
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
      microTask(() => {
        this.viewsCache = Array.from(this.$layoutWrapper.children) as EpubView[];
      });
    }

    // 当前的进度
    // this.location.test();
  }

  /**
   * @description 设置虚拟列表的实际内容（虚拟列表）
   */
  setContent() {
    this.rContent!.innerHTML = '';
    const scrollTop = this.$layoutWrapper.scrollTop;

    // 当前需要真是渲染的内容跨度
    const getSlice = (scrollTop: number, containerHeight: number) => {
      let height = 0;
      let start = -1;
      let end = -1;
      const startPos = scrollTop;
      const endPos = scrollTop + containerHeight;

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
    };

    const [start, end] = getSlice(scrollTop, this.$layoutWrapper.clientHeight);

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
    this.vContent!.style.height = this.computeViewsDistance(this.viewsCache.length) + 'px';
  }

  computeViewsDistance(end: number) {
    return this.viewsCache.slice(0, end).reduce((prev, next) => {
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
        top: this.computeViewsDistance(topViewIndex),
      });

      macroTask(() => {
        // 当view渲染出来后，再次调整滚动高度
        const top = this.computeViewsDistance(topViewIndex);
        let offset = 0;
        if (target.path) {
          const el = this.location.getClosestElementFromCFI(view, target);
          offset = el.offsetTop - view.offsetTop;
        }
        this.$layoutWrapper.scrollTo({
          top: top + offset,
        });
      });
    } else {
      const el = this.location.getClosestElementFromCFI(view, target);
      this.$layoutWrapper.scrollTo({
        top: el.offsetTop,
      });
    }
  }
}
