import type { EpubElementInstanceType } from './epub-element';

const instances = new Map<string, EpubElementInstanceType>(); // 全局所有实例

class GlobalStore {
  static hasInstance(uuid: string) {
    return instances.has(uuid);
  }

  static getInstance(uuid: string) {
    return instances.get(uuid);
  }

  static setInstance(uuid: string, instance: EpubElementInstanceType) {
    instances.set(uuid, instance);
  }

  static removeInstance(uuid: string) {
    instances.delete(uuid);
  }
}

export { GlobalStore };
