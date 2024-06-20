type ComposedSelection = {
  getComposedRanges: (shadowRoot: ShadowRoot) => Range[];
} & Selection;

type SelectionRoot = ShadowRoot & {
  getSelection: () => Selection | null;
};

/**
 * @description 因为目前ShadowDom对于Selection API的支持不足，所以自定义一个ShadowSelection类包装处理下，提供一些辅助方法，并尽量减少兼容性问题
 * https://github.com/mfreed7/shadow-dom-selection
 */
export class ShadowSelection {
  #shadowRoot: ShadowRoot;
  _selection: Selection;
  isCollapsed: boolean;

  constructor(shadowRoot: ShadowRoot) {
    this.#shadowRoot = shadowRoot;

    let selection: Selection | null = null;
    if ('getSelection' in shadowRoot) {
      selection = (shadowRoot.getSelection as Document['getSelection'])();
    } else {
      selection = document.getSelection();
    }
    if (!selection) {
      throw new Error('no selection');
    }

    // isCollapsed
    // [为什么`Selection.isCollapsed`在阴影DOM中总是正确的？] https://cloud.tencent.com/developer/ask/sof/108804120
    // 这里根据元素和偏移位置，重新设置isCollapsed
    let isCollapsed = true;
    if (selection.isCollapsed === false) {
      isCollapsed = false;
    } else if ((selection as any).baseNode && (selection as any).extentNode) {
      if ((selection as any).baseNode !== (selection as any).extentNode) {
        isCollapsed = false;
      } else {
        if ((selection as any).baseOffset !== (selection as any).extentOffset) {
          isCollapsed = false;
        } else {
          isCollapsed = true;
        }
      }
    }
    this.isCollapsed = isCollapsed;
    this._selection = selection;
  }

  getRange(at = 0) {
    if (this._selection.type === 'None' || this._selection.rangeCount === 0) {
      return null;
    }

    // 规范 getComposedRanges, CH--FF--SF17
    // https://developer.mozilla.org/en-US/docs/Web/API/Selection/getComposedRanges
    if ('getComposedRanges' in this._selection) {
      const ranges = (this._selection as ComposedSelection).getComposedRanges(this.#shadowRoot);
      if (!ranges || ranges.length === 0) return null;

      // const firstRange = ranges[0];
      // const range = document.createRange();
      // range.setStart(firstRange.startContainer, firstRange.startOffset);
      // range.setEnd(firstRange.endContainer, firstRange.endOffset);
      return ranges[at];
    }

    return this._selection.getRangeAt(0);
  }
}
