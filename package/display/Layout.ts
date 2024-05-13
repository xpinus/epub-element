import type { EpubElementInstanceType } from '../core/epub-element';

type LayoutOptions = {
  viewer: EpubElementInstanceType;
  container: HTMLElement;
  orientation?: 'portrait' | 'landscape';
  loadmethod?: 'dynamic' | 'full';
  readmode?: 'continuous' | 'pagination';
};

class Layout {
  viewer: EpubElementInstanceType;
  layoutWrapper: HTMLDivElement;

  constructor(options: LayoutOptions) {
    console.log('BaseLayout');

    // if (options.orientation === 'portrait') {
    //   // 垂直
    // } else {
    // }

    const layoutWrapper = document.createElement('div');
    layoutWrapper.className = 'epub-viewer-layout';
    layoutWrapper.className = 'epub-viewer-continuous';
    this.layoutWrapper = layoutWrapper;
    options.container.append(layoutWrapper);

    this.viewer = options.viewer;
  }

  render() {
    const fragment = document.createDocumentFragment();
    this.viewer.book.spine.forEach((item) => {
      const href = this.viewer.book.manifest!.get(item.idref)?.href || '';

      const view = document.createElement('epub-view');
      view.setAttribute('idref', item.idref);
      view.setAttribute('href', href);

      fragment.append(view);
    });

    this.layoutWrapper.append(fragment);

    // 当前的进度

    // 获取对应的文件id

    // 插入epub-view

    // 根据不同的阅读模式进行不同的填充渲染
  }
}

// // 定义一个接口类型，包含自定义属性
// interface EpubViewElement extends HTMLElement {
//   idref: string;
// }

export default Layout;
