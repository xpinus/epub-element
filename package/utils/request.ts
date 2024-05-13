/**
 * 请求数据，返回 blob
 * @param url 请求地址
 */
export async function request(url: string) {
  const response = await fetch(url);

  return await response.blob();
}
