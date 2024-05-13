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
