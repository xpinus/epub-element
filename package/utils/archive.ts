import * as zip from '@zip.js/zip.js';
import { request } from './request';
import { extractUrls, REGEX_MATCH_LINKS } from './utils';
import { XMLParser } from './xml';

const CONTAINER_PATH = 'META-INF/container.xml';

/**
 * @description 用于解压提取epub文件内容
 */
export class Archive {
  private zipMap = new Map();
  private resourceCache = new Map();

  constructor() {}

  /**
   * @description 请求并打开压缩包
   * @param url epub文件路径
   */
  public async open(url: string) {
    const blob = await request(url);
    return this.parse(blob);
  }

  /**
   * @description 解析epub文件基本数据
   * @param blob blob格式的zip文件
   */
  private async parse(blob: Blob) {
    await this.unzip(blob);

    // container.xml
    const rootPath = await XMLParser.parseContainerXML((await this.get(CONTAINER_PATH)) as string);

    // content.opf
    const contentXMLDoc = await XMLParser.parseContentOPF((await this.get(rootPath)) as string);

    // metadata
    const metadata = XMLParser.parseMetadata(contentXMLDoc);

    // manifest
    const manifest = XMLParser.parseManifest(contentXMLDoc);

    // spine
    const spine = XMLParser.parseSpine(contentXMLDoc);

    // guide
    const guide = XMLParser.parseGuide(contentXMLDoc);

    return { metadata, manifest, spine, guide };
  }

  /**
   * @description 解压获取zip文件索引，但并未真正解压出文件
   * @param blob blob格式的zip文件
   * @returns zipMap: zip文件中各个文件和entry构成的Map
   */
  private async unzip(blob: Blob) {
    const zipFileReader = new zip.BlobReader(blob);
    const zipReader = new zip.ZipReader(zipFileReader);

    const entries = await zipReader.getEntries();
    entries.forEach((entry) => {
      if (entry.filename.endsWith('toc.ncx')) {
        // no matter where the toc.ncx is in the zip file， we will set it to the root of the zip
        this.zipMap.set('toc.ncx', entry);
      } else {
        this.zipMap.set(entry.filename, entry);
      }
    });
    zipReader.close();

    return this.zipMap;
  }

  /**
   * @description 检查文件是否已经被解压缓存了
   * @param path filepath in archive
   */
  public has(path: string) {
    return this.resourceCache.has(path);
  }

  /**
   * @description 从压缩包中获取文件
   * @param path  filepath in archive
   * @returns content
   */
  public async get(path: string, type: 'text' | 'blob' = 'text') {
    if (this.resourceCache.has(path)) {
      return this.resourceCache.get(path);
    } else {
      if (!this.zipMap.has(path)) {
        throw new Error('file not found: ' + path);
      }

      // Extract file from zip
      const entry = this.zipMap.get(path);
      let writer = null;
      if (type === 'blob') {
        writer = new zip.BlobWriter();
      } else {
        writer = new zip.TextWriter();
      }
      const content = await entry.getData(writer);

      // Cache the content and delete the entry
      this.resourceCache.set(path, content);
      this.zipMap.delete(path);

      return content;
    }
  }

  /**
   * @description 获取spine的html文件内容
   * @param path
   * @returns
   */
  public async getSpineHtml(path: string) {
    let spineHtml = await this.get(path);
    spineHtml = await this.replaceWithBlob(spineHtml);

    return spineHtml;
  }

  /**
   * @description 将href和src指向的资源替换为blob
   * @param html
   */
  private async replaceWithBlob(html: string) {
    const links = extractUrls(html);
    if (!links || links.length === 0) {
      return html;
    }

    console.log(links);

    // 解压出文件
    const promises = links.map((link) => this.get(link, 'blob'));
    await Promise.allSettled(promises).catch((err) => {
      console.error(err);
    });

    // 使用blob替换
    for (let i = 0; i < REGEX_MATCH_LINKS.length; i++) {
      html = html.replace(REGEX_MATCH_LINKS[i], (match, url) => {
        const path = url.split('#')[0];
        const blob = this.resourceCache.get(path);
        let blobUrl = null;
        try {
          blobUrl = URL.createObjectURL(blob);
        } catch (err) {
          console.warn(err);
        }

        const res = blobUrl ? match.replace(url, blobUrl) : match;

        return res;
      });
    }

    return html;
  }
}
