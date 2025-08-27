/**
 * 基于URL生成一致颜色的工具
 * 确保同一个URL始终生成相同的颜色
 */

/**
 * 简单哈希函数，将字符串转换为数字
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
}

/**
 * HSL转RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // 灰色
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * 简化的颜色配置
 */
const COLOR_CONFIG = {
  saturation: 65, // 饱和度 (0-100)
  lightness: 50, // 亮度 (0-100)
};

/**
 * 根据URL生成一致的颜色（简化版，仅作为后备）
 * @param url 供应商URL
 * @returns HSL颜色字符串
 */
export function generateProviderColor(url: string) {
  // 标准化URL，移除协议和尾部斜杠
  const normalizedUrl = url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  // 生成哈希值
  const hash = hashString(normalizedUrl);

  // 基于哈希生成色相 (0-360)
  const hue = hash % 360;

  // 返回简化的颜色对象（保持向后兼容）
  const [r, g, b] = hslToRgb(hue, COLOR_CONFIG.saturation, COLOR_CONFIG.lightness);

  // 转换为十六进制
  const hexColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  return {
    solidColor: hexColor,
    backgroundColor: `${hexColor}1A`, // 十六进制透明度 (10%)
    borderColor: `${hexColor}99`, // 十六进制透明度 (60%)
    rgb: [r, g, b] as [number, number, number],
    hue,
  };
}
