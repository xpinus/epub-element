interface EpubViewElement extends HTMLElement {
  idref: string;
  href: string;
}

declare interface HTMLElementTagNameMap {
  'epub-view': EpubViewElement;
}
