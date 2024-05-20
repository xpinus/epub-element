import ViewManager from '../manager';
import eventbus, { EventBusEventType } from '../../core/eventbus';

import type { EpubElelementContain, EpubView } from '../../core/elements';

type ContinuousViewManagerOptions = {
  viewer: EpubElelementContain;
  virtual?: boolean;
};

export default class ContinuousViewManager extends ViewManager {
  // size = clientHeight / itemHeight  //可视区域item数量
  // start  // 数据开始截取的位置
  // end = start + size  // 截取的末尾位置

  // // 监听滚动
  // start = Math.floor(scrollTop / itemHeight)

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
      const vContent = document.createElement('div'); // 虚拟内容区
      vContent.className = 'virtuallist-virtual-content';
      const rContent = document.createElement('div'); // 真实内容区
      rContent.className = 'virtuallist-real-content';

      this.$layoutWrapper.append(vContent, rContent);

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

      // 加载但不渲染，获得真实的高度给vContent
      // https://juejin.cn/post/6999419106097102879
      vContent.append(...Array.from(fragment.children));

      let cache: EpubView[] = [];

      // 当前需要真是渲染的内容跨度
      const getSlice = (scrollTop: number, containerHeight: number) => {
        let height = 0;
        let start = -1;
        let end = -1;
        const startPos = scrollTop;
        const endPos = scrollTop + containerHeight;

        for (let i = 0; i < cache.length; i++) {
          const view = cache[i] as EpubView;
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

        return [start, end];
      };

      const getContent = () => {
        rContent.innerHTML = '';
        const scrollTop = this.$layoutWrapper.scrollTop;
        const [start, end] = getSlice(scrollTop, this.$layoutWrapper.clientHeight);
        console.log(start, end);

        const renderList = cache.slice(start, end + 1);
        rContent.append(...renderList);

        // ? 这里有问题，在看看别的文章这里怎么实现的
        const transformY = cache.slice(0, start).reduce((prev, next) => {
          return (prev += next.height);
        }, 0);
        rContent.style.transform = `translateY(${transformY}px)`;
      };

      Promise.resolve().then(() => {
        cache = Array.from(vContent.children) as EpubView[];

        console.log(
          cache,
          cache.reduce((prev, next) => {
            return (prev += next.height);
          }, 0),
          vContent.scrollHeight,
        );

        vContent.style.height = vContent.scrollHeight + 'px';

        vContent.innerHTML = '';

        getContent();
      });

      this.$layoutWrapper.addEventListener('scroll', () => {
        getContent();
      });

      eventbus.on(EventBusEventType.VIEW_SIZE_CHANGE, () => {
        vContent.style.height =
          cache.reduce((prev, next) => {
            return (prev += next.height);
          }, 0) + 'px';
      });
    } else {
      this.renderFullSpine();
    }

    // 当前的进度

    // 获取对应的文件id

    // 插入epub-view

    // 根据不同的阅读模式进行不同的填充渲染
  }

  getVirtualListContent() {}
}
