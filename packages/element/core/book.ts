import { Archive } from '../utils';

export type Metadata = {
  [key: string]: string | string[] | null;
};

type ManifestItem = {
  href: string;
  mediaType: string;
  resource?: any;
};
export type Manifest = Map<string, ManifestItem>;
export type Spine = {
  idref: string;
  properties?: string;
  href?: string;
  content?: string;
};

type GuideReference = {
  title: string;
  type: string;
};
export type Guide = Map<string, GuideReference>;

/**
 * @description 负责epub原始文件内容获取解析，一切和epub内容相关的逻辑都在这里
 */
class Book {
  private archive = new Archive();
  public metadata: Metadata = {};
  public manifest: Manifest | null = null;
  public spine: Spine[] = [];
  public guide: Guide = new Map();

  constructor() {}

  /**
   * @description 打开并解析epub文件
   * @param url
   */
  async open(url: string) {
    // 请求和打开文件获得基本信息
    const epubInfo = await this.archive.open(url);
    // metadata
    this.metadata = epubInfo.metadata;
    // manifest
    this.manifest = epubInfo.manifest;
    // spine
    this.spine = epubInfo.spine;
    // guide
    this.guide = epubInfo.guide;

    // 通过worker去获取resource
  }

  getSpineContent(href: string) {
    const spine = this.spine.find((item) => item.href === href);
    if (!spine) {
      throw new Error(`can not find ${href} in spine`);
    }

    return spine.content || '';
  }
}

export default Book;
