/**
 * @description 创建一个宏任务
 */
export function macroTask(callback: () => void) {
  setTimeout(() => callback(), 0);
}

/**
 * @description 创建一个微任务
 */
export function microTask(callback: () => void) {
  if (typeof queueMicrotask !== 'undefined') {
    queueMicrotask(callback);
  } else if (typeof Promise !== 'undefined') {
    Promise.resolve().then(callback);
  } else if (typeof MutationObserver !== 'undefined') {
    let counter = 1;
    const observer = new MutationObserver(() => {
      callback();
    });
    const textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
      characterData: true,
    });
    textNode.data = String(++counter);
  }
}
