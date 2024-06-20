import type { Metadata, Manifest, Spine, Guide } from '../core/book';

export class XMLParser {
  private static parser = new DOMParser();

  /**
   * 将XML文本解析为 XML Document
   * @param text XML文本
   * @returns
   */
  static parseXMLDocument(text: string): XMLDocument {
    return XMLParser.parser.parseFromString(text, 'application/xml');
  }

  /**
   * @description 解析container.xml文件
   * @param containerXMLText container.xml文件的文本
   * @returns content.opf 文件的路径
   */
  static async parseContainerXML(containerXMLText: string) {
    const containerXMLDoc = XMLParser.parseXMLDocument(containerXMLText);

    const rootfile: string = containerXMLDoc.getElementsByTagName('rootfile')[0].getAttribute('full-path')!;

    if (!rootfile) {
      throw new Error("content.opf's path not found");
    }

    return rootfile;
  }

  /**
   * 解析content.opf文件
   * @param contentOPF
   */
  static async parseContentOPF(contentOPF: string) {
    const contentXML = XMLParser.parseXMLDocument(contentOPF);
    return contentXML;
  }

  /**
   * 从content.xml中解析metadata
   * @param contentXML
   * @returns
   */
  static parseMetadata(contentXML: XMLDocument) {
    const metadata: Metadata = {};
    const metadataXML: any = contentXML.getElementsByTagName('metadata')[0];

    metadata.title = XMLParser.getElementText(metadataXML, 'title') || '';
    metadata.creator = XMLParser.getElementText(metadataXML, 'creator') || '';
    metadata.description = XMLParser.getElementText(metadataXML, 'description');
    metadata.pubdate = XMLParser.getElementText(metadataXML, 'date');
    metadata.publisher = XMLParser.getElementText(metadataXML, 'publisher');
    metadata.identifier = XMLParser.getElementText(metadataXML, 'identifier');
    metadata.language = XMLParser.getElementText(metadataXML, 'language');
    metadata.rights = XMLParser.getElementText(metadataXML, 'rights');

    // metadata.modified_date = getPropertyText(xml, 'dcterms:modified');
    // metadata.layout = getPropertyText(xml, 'rendition:layout');
    // metadata.orientation = getPropertyText(xml, 'rendition:orientation');
    // metadata.flow = getPropertyText(xml, 'rendition:flow');
    // metadata.viewport = getPropertyText(xml, 'rendition:viewport');
    // metadata.media_active_class = getPropertyText(xml, 'media:active-class');
    // metadata.spread = getPropertyText(xml, 'rendition:spread');

    return metadata;
  }

  /**
   * 从content.xml中解析manifest
   * @param contentXML
   * @returns
   */
  static parseManifest(contentXML: XMLDocument) {
    const manifest: Manifest = new Map();
    const manifestXML: any = contentXML.getElementsByTagName('manifest')[0];

    const items = manifestXML.getElementsByTagName('item');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      const mediaType = item.getAttribute('media-type');
      manifest.set(id, { href, mediaType });
    }

    return manifest;
  }

  /**
   * 从content.xml中解析spine
   * @param contentXML
   * @returns
   */
  static parseSpine(contentXML: XMLDocument) {
    const spine: Spine[] = [];
    const spineXML: any = contentXML.getElementsByTagName('spine')[0];

    const items = spineXML.getElementsByTagName('itemref');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const idref = item.getAttribute('idref');
      const properties = item.getAttribute('properties');
      spine.push({ idref, properties });
    }

    return spine;
  }

  /**
   * 从content.xml中解析guide
   * @param contentXML
   * @returns
   */
  static parseGuide(contentXML: XMLDocument) {
    const guide: Guide = new Map();
    const manifestXML: any = contentXML.getElementsByTagName('guide')[0];

    const items = manifestXML.getElementsByTagName('reference');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = item.getAttribute('title');
      const href = item.getAttribute('href');
      const type = item.getAttribute('type');
      guide.set(href, { title, type });
    }

    return guide;
  }

  /**
   * Get text of a namespaced element
   * @return {string} text
   */
  static getElementText(xml: XMLDocument, tag: string) {
    const found = xml.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', tag);

    if (!found || found.length === 0) return '';

    const el = found[0];

    if (el.childNodes.length) {
      return el.childNodes[0].nodeValue;
    }

    return '';
  }

  /**
   * Get text by property
   * @private
   * @param  {node} xml
   * @param  {string} property
   * @return {string} text
   */
  // static getPropertyText(xml:XMLDocument, property: string) {
  //   var el = qsp(xml, 'meta', { property: property });

  //   if (el && el.childNodes.length) {
  //     return el.childNodes[0].nodeValue;
  //   }

  //   return '';
  // }
}
