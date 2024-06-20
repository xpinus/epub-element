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

/**
 * @description 获取对象的类型
 */
export function getObjectType(obj: Object) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * @description Extend properties of an object
 */
export function extend<T extends object, S extends object[]>(target: T, ...sources: S): T & UnionToIntersection<S[number]> {
  sources.forEach(function (source) {
    if (!source) return;
    Object.getOwnPropertyNames(source).forEach(function (propName) {
      Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName)!);
    });
  });
  return target as T & UnionToIntersection<S[number]>;
}

/**
 * @description 判断是否为number
 */
export function isNumber(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * @description 是否是一个epubcfi string
 */
export function isCFIString(cfi: any) {
  if (typeof cfi !== 'string') return false;

  const reg = new RegExp(/^epubcfi\((.*)\)$/);

  cfi = cfi.trim();
  const m = cfi.match(reg);
  if (!m || m.length < 2) return false;

  return true;
}

/**
 * @description 判断是否为空
 */
export function isEmpty(target: any) {
  if (!target) return true;
  else if (target instanceof Array) return target.length === 0;
  else if (target instanceof Map || target instanceof Set) return target.size === 0;
  else {
    return Object.keys(target).length === 0;
  }
}
