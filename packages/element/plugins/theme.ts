import Plugin, { PluginOption } from './plugin';
import { AtLeastOne } from '../utils';
import { EpubView } from '..';
import { EventBusEventsEnum } from '../core/eventbus';

type StyleRules = { [selector: string]: [attribute: string, value: string, priority?: boolean][] };

type ThemeConfig = AtLeastOne<{
  rules: StyleRules;
  link: string;
}> & {
  containerStyle?: string;
};

type ThemePluginOption = PluginOption & {
  theme?: string;
  register?: { [themeName: string]: ThemeConfig };
};

const DEFAULT_ACTIVE_THEME = 'default';
const DEFAULT_THEMES: [string, ThemeConfig][] = [
  [
    'default',
    {
      rules: {
        body: [],
      },
    },
  ],
  [
    'light',
    {
      rules: {
        body: [
          ['color', '#000', true],
          ['background', '#FFF', true],
        ],
      },
      containerStyle: 'background-color: #FFF;',
    },
  ],
  [
    'dark',
    {
      rules: {
        body: [
          ['color', '#FFF', true],
          ['background', '#000', true],
        ],
      },
      containerStyle: 'background-color: #000;',
    },
  ],
  [
    'eye',
    {
      rules: {
        body: [['background', '#c7edcc', true]],
      },
      containerStyle: 'background-color: #c7edcc;',
    },
  ],
];

class Theme extends Plugin {
  themes: Map<string, ThemeConfig> = new Map(DEFAULT_THEMES);
  _current: string = '';

  constructor(opt: ThemePluginOption) {
    const epubEl = opt.epubEl;
    super({ epubEl });

    if (opt.register) {
      for (const [themeName, themeConfig] of Object.entries(opt.register)) {
        this.themes.set(themeName, themeConfig);
      }
    }

    // this._instance.event.on(EventBusEventsEnum.RENDERED, () => {
    this.active(opt.theme || DEFAULT_ACTIVE_THEME);
    // });
  }

  beforePluginDestroy(): void {}

  /**
   * 切换主题
   */
  active(themeName: string) {
    if (this._current === themeName) return;

    if (!this.themes.has(themeName)) {
      console.warn(`theme ${themeName} not exist`);
      return;
    }

    this._current = themeName;
    console.log('current theme', this._current);
    this.render();
  }

  /**
   * 更新主题样式
   */
  update(themeName: string, config: ThemeConfig) {
    if (!this.themes.has(themeName)) {
      console.warn(`theme ${themeName} not exist`);
      return;
    }

    this.themes.set(themeName, config);
    if (this._current === themeName) {
      this.render();
    }
  }

  /**
   * 渲染主题
   */
  render() {
    const views = this._instance.rendition?.layout.viewsCache;
    if (!views || views.length === 0) {
      console.warn('no views found');
      return;
    }

    const theme = this.themes.get(this._current);
    if (theme?.rules) {
      this.addCSSStyle(views, theme.rules, '__epub_view_theme');
    } else if (theme?.link) {
      this.addCSSSLink(views, theme.link, '__epub_view_theme');
    }

    if (theme?.containerStyle) {
      this._instance.$el!.$container.setAttribute('style', theme.containerStyle);
    } else {
      this._instance.$el!.$container.removeAttribute('style');
    }
  }

  /**
   * 在head末尾追加新的内联样式表
   * @param view 目标view
   * @param css
   * @param id 唯一id，如果有则覆盖而不是新增
   */
  addCSSStyle(views: EpubView[], rules: StyleRules, id: string) {
    const cssRules = Object.entries(rules);
    const styleEl = document.createElement('style');
    styleEl.id = id;

    // https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule
    // const styleSheet = (styleEl as HTMLStyleElement).sheet!;

    for (let i = 0; i < cssRules.length; i++) {
      const selector = cssRules[i][0];
      const ruleArr = cssRules[i][1];

      const css = `
        ${selector} {
          ${ruleArr
            .map((rule) => {
              return `${rule[0]}: ${rule[1]} ${rule[2] ? ' !important' : ''};`;
            })
            .join('')}
        }
      `;

      styleEl.innerHTML += css;
    }

    views.forEach((view) => {
      const viewStyleEl = view.$head.querySelector(`#${id}`);
      if (viewStyleEl) {
        viewStyleEl.remove();
      }

      view.$head.append(styleEl.cloneNode(true));
    });
  }

  /**
   * 在head末尾追加新的外联样式表
   * @param href
   * @param id 唯一id，如果有则覆盖而不是新增
   */
  addCSSSLink(views: EpubView[], href: string, id: string) {
    const linkEl = document.createElement('link');
    linkEl.id = id;
    linkEl.setAttribute('rel', 'stylesheet');
    linkEl.setAttribute('href', href);

    views.forEach((view) => {
      const viewStyleEl = view.$head.querySelector(`#${id}`);
      if (viewStyleEl) {
        viewStyleEl.remove();
      }
      view.$head.append(linkEl.cloneNode(true));
    });
  }

  /**
   * 注册一个新的主题
   */
  register(themeName: string, config: ThemeConfig) {
    if (this.themes.has(themeName)) {
      this.update(themeName, config);
      return;
    }

    this.themes.set(themeName, config);
  }

  // todo 单独修改某个样式
  css() {}
}

Theme.pluginName = 'theme';

export default Theme;
