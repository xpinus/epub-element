import { v4 as uuidv4 } from 'uuid';

/**
 * 创建唯一标识
 * @returns uuid
 */
export function createUUID() {
  return uuidv4();
}
