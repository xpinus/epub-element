import EpubCFI from './epubcfi';
import { createUUID } from '../utils';
import EpubView from './elements/el-view';
import Rendition from './rendition';

// 支持的批注类型
export enum AnnotationType {
  highlight = 'highlight',
  underline = 'underline',
}

type AnnotationOptions = {
  hash: string;
  type: AnnotationType;
  cfi: EpubCFI;
  classList?: string[];
};

export class Annotation {
  hash: string;
  type: AnnotationType;
  cfi: EpubCFI;
  classList: string[];
  view: EpubView | null = null;
  mark: any | null = null;

  constructor(options: AnnotationOptions) {
    this.hash = options.hash;
    this.type = options.type;
    this.cfi = options.cfi;
    this.classList = options.classList || [];
  }

  bind(view: EpubView) {
    this.view = view;
  }

  unbind() {
    if (!this.view) return;
    this.view = null;
  }

  attach() {
    if (!this.view) return;
    this.view.addAnnotation(this);
  }

  detach() {
    if (!this.view) return;
    this.view.removeAnnotation(this.hash);
    if (this.mark) this.mark = null;
  }

  destroy() {
    this.detach();
    this.unbind();
  }

  get element() {
    return this.mark?.$group;
  }
}

class Annotations {
  annotations: Map<string, Annotation> = new Map();
  rendition: Rendition;

  constructor(rendition: Rendition) {
    this.rendition = rendition;
  }

  add(type: AnnotationType, cfiRange: EpubCFI | Range, classList?: string[]) {
    const hash = createUUID();

    let cfi: EpubCFI;
    if (cfiRange instanceof EpubCFI) {
      cfi = cfiRange;
    } else if (cfiRange instanceof Range) {
      const start = cfiRange.startContainer;
      const root = start.getRootNode() as ShadowRoot;
      const view = root.host as EpubView;
      const viewIndex = this.rendition.layout.viewsCache.indexOf(view);
      cfi = new EpubCFI(cfiRange, `/6/${(viewIndex + 1) * 2}`);
    } else {
      throw new Error('invalid cfiRange: ' + cfiRange + ', should be EpubCFI or Range');
    }

    const annotation = new Annotation({
      hash,
      type,
      cfi,
      classList,
    });

    this.annotations.set(hash, annotation);

    this.render(annotation);

    return annotation;
  }

  remove(annot: Annotation) {
    if (!this.annotations.has(annot.hash)) {
      return;
    }

    const annotation = this.annotations.get(annot.hash)!;
    annotation.destroy();

    this.annotations.delete(annot.hash);
  }

  clear() {
    this.annotations.forEach((annotation) => {
      annotation.destroy();
    });

    this.annotations.clear();
  }

  size() {
    return this.annotations.size;
  }

  render(annot?: Annotation) {
    let list = [];
    if (!annot) {
      list = Array.from(this.annotations.values());
    } else {
      list = [annot];
    }

    list.forEach((annotation) => {
      const view = this.rendition.layout.viewsCache[annotation.cfi.spineIndex];
      if (!view) {
        console.warn('view not found: ', annotation.cfi.spineIndex);
        return;
      }
      annotation.bind(view);
      annotation.attach();
    });
  }

  highlight(cfi: EpubCFI, classList: string[] = []) {
    return this.add(AnnotationType.highlight, cfi, classList);
  }

  underline(cfi: EpubCFI, classList: string[] = []) {}
}

export default Annotations;
