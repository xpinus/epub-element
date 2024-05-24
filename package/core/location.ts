import EpubCFI from './epubcfi';
import { EpubView } from './elements';

export default class Location {
  percent: number = 0; // 百分比

  constructor() {}

  test() {
    const test = 'epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)';
    const cfi = new EpubCFI(test);

    console.log(test);
    console.log(cfi.toString());
  }

  /**
   * @description 获得EpubCFI指向的最邻近的元素节点
   */
  getClosestElementFromCFI(view: EpubView, target: EpubCFI) {
    let el: HTMLElement = view;
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
}
