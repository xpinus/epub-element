import ContinuousViewManager from './managers/continuous';
import ViewManager, { ManagerOrientation, ManagerReadMode } from './managers/manager';
import eventbus, { EventBusEventsEnum } from './eventbus';
import { isCFIString } from '../utils';
import EpubCFI from './epubcfi';

import type EpubElelementContain from './elements/el-contain';

type RenditionOptions = {
  viewer: EpubElelementContain;
  orientation?: ManagerOrientation;
  readmode?: ManagerReadMode;
  virtual?: boolean;
};

class Rendition {
  viewer: EpubElelementContain;
  manager: ViewManager;

  constructor(options: RenditionOptions) {
    this.viewer = options.viewer;

    this.manager = this.getManager({
      viewer: this.viewer,
      orientation: ManagerOrientation.Portrait,
      readmode: ManagerReadMode.Continuous,
      virtual: true,
    });

    eventbus.on(EventBusEventsEnum.CONTENT_LINK_CLICKED, (href: string) => {
      this.display(href);
    });
  }

  render() {
    this.manager.render();
  }

  /**
   * @description 显示指定的页面
   * @param target spine href | epubcfi (EpubCFI) | percentage[0-1]
   */
  display(target: string | number | EpubCFI) {
    let cfi: EpubCFI | null = null;

    if (typeof target === 'string') {
      if (isCFIString(target)) {
        cfi = new EpubCFI(target);
      } else {
        cfi = this.convertHrefToCfi(target);
      }
    } else if (!isNaN(Number(target))) {
      const percent = Number(target);
      if (percent > 0 && percent < 1) {
        console.log(percent);
        // todo percent跳转
      }
    } else if (target instanceof EpubCFI) {
      cfi = target;
    }

    if (!cfi || !(cfi instanceof EpubCFI)) {
      throw new Error('invalid target: ' + target);
    }

    console.log(cfi.toString());

    this.manager.display(cfi);
  }

  convertHrefToCfi(href: string) {
    const reg = new RegExp(/^\/?(.*\.html)(#.*)$/);

    const m = href.match(reg);
    if (!m || m.length < 2) {
      throw new Error('invalid href: ' + href);
    }

    const chapter = m[1];
    const contentPos = m[2];

    const viewIndex = this.manager.viewsCache.findIndex((view) => view.href === chapter);
    if (viewIndex === -1) {
      throw new Error('view not found: ' + href);
    }
    const view = this.manager.viewsCache[viewIndex];

    let targetNode: HTMLElement;
    if (contentPos) {
      targetNode = view.shadowRoot!.querySelector(contentPos)!;
    } else {
      targetNode = view.shadowRoot!.children[0] as HTMLElement;
    }

    // console.log(chapter, contentPos, view, targetNode);

    return new EpubCFI(targetNode, `/6/${(viewIndex + 1) * 2}`);
  }

  /**
   * @description 获取manager
   */
  getManager({
    viewer,
    readmode = ManagerReadMode.Continuous,
    orientation = ManagerOrientation.Portrait,
    virtual = true,
  }: {
    viewer: EpubElelementContain;
    orientation?: ManagerOrientation;
    readmode?: ManagerReadMode;
    virtual?: boolean;
  }): ViewManager {
    let manager: ViewManager;

    console.log(readmode, orientation, virtual);

    switch (readmode) {
      case ManagerReadMode.Continuous:
        manager = new ContinuousViewManager({
          viewer,
          virtual,
        });
        break;
      default:
        throw new Error('readmode not found');
    }

    return manager;
  }
}

export default Rendition;
