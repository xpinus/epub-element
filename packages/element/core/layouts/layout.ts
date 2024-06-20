import { isBoolean, microTask, animate } from '../../utils';
import EpubCFI from '../epubcfi';
import { EventBusEventsEnum } from '../eventbus';

import type { EpubElementInstanceType } from '../epub-element';
import type EpubView from '../elements/el-view';
import type { TimingEquationsType, TimingFunction } from '../../utils';
import type { Spine } from '../book';
import { EpubElelementContain } from '../elements';

type SmoothConfig = {
  duration?: number;
  timing?: TimingFunction | TimingEquationsType;
};

const DEFAULT_DURATION = 300;
const DEFAULT_TIMING = 'easeOutSine';

let POSITION_ANIMATE_LOCK = false;

export type ViewLayoutOptions = {
  epubEL: EpubElementInstanceType;
  virtual?: boolean;
};

export default abstract class ViewLayout {
  viewsCache: EpubView[] = []; // 已经渲染的视图的缓存
  currentViews: EpubView[] = []; // 当前渲染的视图
  _instance: EpubElementInstanceType;
  $layoutWrapper: HTMLDivElement;
  virtual: boolean = true;
  $vContent: HTMLElement | null = null;
  $rContent: HTMLElement | null = null;
  _percent: number = 0;
  $el: EpubElelementContain;

  constructor(options: ViewLayoutOptions) {
    this._instance = options.epubEL;
    this.virtual = isBoolean(options.virtual) ? options.virtual! : true;

    const layoutWrapper = document.createElement('div');
    layoutWrapper.className = 'epub-view-layout';
    this.$layoutWrapper = layoutWrapper;

    if (!this._instance.$el) {
      throw new Error('epub-element not found');
    }
    this.$el = this._instance.$el;
    this.$el.$container.append(layoutWrapper);
  }

  /**
   * @description 渲染
   */
  render() {
    if (!this._instance.book) {
      throw new Error("epub's book not found");
    }

    if (this.virtual) {
      // 虚拟列表
      this.$vContent = document.createElement('div'); // 虚拟内容区
      this.$vContent.className = 'virtuallist-virtual-content';
      this.$rContent = document.createElement('div'); // 真实内容区
      this.$rContent.className = 'virtuallist-real-content';

      this.$layoutWrapper.append(this.$vContent, this.$rContent);

      // 加载但不渲染，获得真实的高度给$vContent (不一定准确)
      // https://juejin.cn/post/6999419106097102879
      this.insertViews(this.$vContent);

      microTask(() => {
        this.updateVirtualContent();
        this.$vContent!.innerHTML = '';
        this.updateRealContent();
      });

      this.$layoutWrapper.addEventListener('scroll', () => {
        this.updateRealContent();
      });

      this._instance.event.on(EventBusEventsEnum.VIEW_SIZE_CHANGE, () => {
        this.updateVirtualContent();
      });
    } else {
      this.insertViews(this.$layoutWrapper);
    }

    this._instance.event.emit(EventBusEventsEnum.RENDERED, this);
  }

  /**
   * @description 插入所有的view
   */
  insertViews(wrapper: HTMLElement, attrs?: { [key: string]: string | number }) {
    if (!this._instance.book) {
      throw new Error("epub's book not found");
    }

    // 允许设置任意自定义属性
    const attr = attrs
      ? Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')
      : '';

    const book = this._instance.book;
    const fragment = document.createElement('div');
    const spineHtml = `
          ${book.spine
            .map((item) => {
              return this.epubViewHtmlTemplate(item);
            })
            .join('')}
        `;
    fragment.innerHTML = spineHtml;

    wrapper.append(...Array.from(fragment.children));
    this.viewsCache = Array.from(wrapper.children) as EpubView[];
  }

  /**
   * @description 渲染epub-view的html模板
   */
  abstract epubViewHtmlTemplate(spine: Spine): string;

  /**
   * @description （虚拟列表）更新设置虚拟内容高度
   */
  abstract updateVirtualContent(): void;

  /**
   * @description （虚拟列表）当前需要渲染的内容跨度
   * @returns [start, end] viewsCache中的索引范围
   */
  abstract getRealContentViewsSlice(): [number, number];

  /**
   * @description （虚拟列表）设置虚拟列表的实际内容
   */
  updateRealContent() {
    this.$rContent!.innerHTML = '';

    const [start, end] = this.getRealContentViewsSlice();
    const renderList = this.viewsCache.slice(start, end + 1);
    this.$rContent!.append(...renderList);

    const transformY = this.computeViewsSize(start);
    this.setRealContentTransform(transformY);
  }

  /**
   * @description （虚拟列表）设置虚拟列表的实际内容区域的偏移
   */
  abstract setRealContentTransform(transform: number): void;

  /**
   * @description 计算视图的累计尺寸
   */
  abstract computeViewsSize(end?: number): number;

  /**
   * @description 滚动到指定位置，不同的layout具体实现
   */
  abstract _scrollTo(position: number): void;

  /**
   * @description 获取当前关注的视图
   */
  abstract getCurrentViewIndex(): {
    view: EpubView;
    viewIndex: number;
    focusPos: number;
  };

  /**
   * @description 获取当前可视区域的EpubCFI
   */
  abstract getCurrentCFI(): EpubCFI;

  /**
   * @description 获得EpubCFI指向的最邻近的元素节点
   */
  getClosestElementFromCFI(view: EpubView, target: EpubCFI) {
    let el: HTMLElement | null = null;
    let node: any = view.$body;

    while (target.path!.steps.length) {
      const step = target.path!.steps.shift()!;
      if (step.type === 'element') {
        const children = Array.from(node.children);
        node = children[step.index];
        el = node;
      }
    }

    return el;
  }

  /**
   * @description 显示指定的页面
   */
  abstract display(target: EpubCFI): void;

  destroy() {}

  get percent() {
    if (this.virtual) {
      console.warn('virtual layout not support  percent for now');
    }

    return this._percent;
  }

  set percent(percent: number) {
    console.warn('layout shuold implement percent set');
  }

  /**
   * @description 直接或平滑滚动到指定位置
   * @description 当smooth不为false时，才有必要设置from
   */
  toPosition({ to, smooth = false, from = 0 }: { to: number; smooth?: boolean | SmoothConfig; from?: number }) {
    if (POSITION_ANIMATE_LOCK) return;

    if (!smooth) {
      this._scrollTo(to);
    } else {
      POSITION_ANIMATE_LOCK = true;
      const diff = to - from;
      animate({
        duration: typeof smooth === 'boolean' ? DEFAULT_DURATION : smooth.duration || DEFAULT_DURATION,
        timing: typeof smooth === 'boolean' ? DEFAULT_TIMING : smooth.timing || DEFAULT_TIMING,
        draw: (progress: number) => {
          this._scrollTo(from + diff * progress);
        },
        callback: () => {
          POSITION_ANIMATE_LOCK = false;
        },
      });
    }
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
   * @description 跳转到下一页
   */
  abstract nextPage(): void;

  /**
   * @description 跳转到上一页
   */
  abstract prevPage(): void;

  /**
   * @description 跳转到下一个章节视图
   */
  nextView() {
    const { viewIndex } = this.getCurrentViewIndex();

    const spineIndex = viewIndex + 1;
    if (spineIndex >= this.viewsCache.length) {
      return;
    }

    const epubCfi = `epubcfi(/6/${(spineIndex + 1) * 2}!)`;

    this.display(new EpubCFI(epubCfi));
  }

  /**
   * @description 跳转到上一个章节视图
   */
  prevView() {
    const { viewIndex } = this.getCurrentViewIndex();

    const spineIndex = viewIndex - 1;
    if (spineIndex < 0) {
      return;
    }
    const epubCfi = `epubcfi(/6/${(spineIndex + 1) * 2}!)`;

    this.display(new EpubCFI(epubCfi));
  }
}
