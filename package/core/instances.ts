import { EpubElementInstanceType } from './epub-element';

/**
 * @description 全局所有epub-element实例管理
 */
const GlobalInstances = new Map<string, EpubElementInstanceType>();

export function getGlobalInstance(uuid: string) {
  return GlobalInstances.get(uuid);
}

export function setGlobalInstance(uuid: string, instance: EpubElementInstanceType) {
  GlobalInstances.set(uuid, instance);
}

export function removeGlobalInstance(uuid: string) {
  GlobalInstances.delete(uuid);
}
