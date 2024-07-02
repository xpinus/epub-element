/**
 * @description 传入的类型转换为可选，但至少有一个属性需要被设置
 */
export type AtLeastOne<T, U = { [K in keyof T]-?: Pick<Required<T>, K> }> = Partial<T> & U[keyof U];
