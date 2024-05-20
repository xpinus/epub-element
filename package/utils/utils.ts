export const REGEX_MATCH_LINKS = [
  /<link[^>]+href=["']([^"']+)["']/g,
  /<img[^>]+src=["']([^"']+)["']/g,
  /<image[^>]+href=["']([^"']+)["']/g,
];

/**
 * 提取html字符串中出现的资源链接
 * @param htmlString
 * @returns
 */
export function extractUrls(htmlString: string) {
  const links = [];

  for (let i = 0; i < REGEX_MATCH_LINKS.length; i++) {
    const regex = REGEX_MATCH_LINKS[i];
    let match;
    while ((match = regex.exec(htmlString)) !== null) {
      links.push(match[1]);
    }
  }

  return links;
}

/**
 * @description 防抖函数
 * @param fn
 * @param delay default[50ms]
 * @returns
 */
export function debounce(fn: Function, delay: number = 50) {
  let timer: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * @description 判断是否为boolean
 */
export function isBoolean(v: any) {
  return typeof v === 'boolean';
}

/**
 * @description 单例
 */
export function singleton<T extends new (...args: any[]) => any>(classname: T) {
  let instance: InstanceType<T>;
  const proxy = new Proxy(classname, {
    construct(target, args) {
      if (!instance) {
        instance = Reflect.construct(target, args);
      }
      return instance;
    },
  });

  (proxy as any).prototype.constructor = proxy;

  return proxy;
}
