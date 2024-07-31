# epub-element

> a JS library base Web Component for rendering ePub documents in the browser

> 使用WebComponent实现的epub解析渲染

![epub组成](https://github.com/xpinus/epub-element/raw/main/docs/images/epub.png)   

![epub展示](https://github.com/xpinus/epub-element/raw/main/docs/images/show.png)   

## Feature💪

- 通过webcomponent实现而不是iframe
- 渲染布局支持连续滚动或者分页模式
- 支持虚拟列表动态渲染
- 插件系统，支持主题色、搜索高亮等
  
## Quick Start

```js
import { EpubElement } from 'epub-element';

EpubElement.openEpub('history.epub').then((epubEl) => {
    // 挂载
    ins.mount(document.getElementById('epub'));
})
```

### Options

#### openEpub(url: string)

option     | description               | type                    | default
:--------: | :--------:                | :--------:             | :--------:
url        | epub文件路径，目前内部是通过fetch去请求的  |   string      |  -


#### mount

> mount(el: HTMLElement, options: EpubElementMountOptions)

EpubElementMountOptions     | description                               | type           | default
:--------:                  | :--------:                                | :--------:     | :--------:
layout                      | 布局            | `scroll`或`paginated`    |  `scroll`
virtual                     | 是否启用虚拟列表，否则全文加载渲染           | boolean        |  `true`
spread                      | 双栏模式（只在`paginated`下有效）           | boolean        |  `false`
plugins                     | epub文件路径，目前内部是通过fetch去请求的    | array          |  []


## Documnets

敬请期待...

## Running Locally

```shell
pnpm i
pnpm run demo:vue  # 在vue3上使用的例子
```