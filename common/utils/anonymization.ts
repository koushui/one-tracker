/**
 * 匿名化工具 - 用于前端截图展示时的脱敏处理
 */

// 供应商匿名名称列表 - 魔法主题
export const ANONYMOUS_PROVIDER_NAMES = [
  "魔法水晶",
  "星辰法师",
  "月光术士",
  "火焰巫师",
  "冰霜法师",
  "雷电术士",
  "自然守护",
  "光明圣者",
  "暗影法师",
  "时空术士",
  "元素大师",
  "神秘法师",
  "古老贤者",
  "魔法学院",
  "法师塔楼",
  "奥术图书",
  "魔法工坊",
  "法术研究",
  "魔导学者",
  "咒语大师",
];

// 分组匿名名称列表 - 樱花/晴空主题
export const ANONYMOUS_GROUP_NAMES = [
  "樱花飞舞",
  "晴空万里",
  "微风轻抚",
  "云朵飘逸",
  "阳光明媚",
  "花瓣飞舞",
  "清晨露珠",
  "午后阳光",
  "黄昏夕阳",
  "夜空繁星",
  "春日暖风",
  "夏日清香",
  "秋叶飘零",
  "冬雪纷飞",
  "彩虹桥梁",
  "蓝天白云",
  "绿草如茵",
  "花香鸟语",
  "溪水潺潺",
  "山峦叠翠",
  "海风习习",
  "波光粼粼",
  "星河璀璨",
  "月色如水",
  "霞光满天",
];

/**
 * 基于原始名称生成一致的匿名名称
 * @param originalName 原始名称
 * @param nameList 匿名名称列表
 * @returns 匿名名称
 */
function generateAnonymousName(originalName: string, nameList: string[]): string {
  let hash = 0;
  for (let i = 0; i < originalName.length; i++) {
    hash = originalName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % nameList.length;
  return nameList[index];
}

/**
 * 获取供应商的匿名名称
 * @param originalName 原始供应商名称
 * @returns 匿名供应商名称
 */
export function getAnonymousProviderName(originalName: string): string {
  return generateAnonymousName(originalName, ANONYMOUS_PROVIDER_NAMES);
}

/**
 * 获取分组的匿名名称
 * @param originalName 原始分组名称
 * @returns 匿名分组名称
 */
export function getAnonymousGroupName(originalName: string): string {
  return generateAnonymousName(originalName, ANONYMOUS_GROUP_NAMES);
}

/**
 * 检查供应商是否设置为匿名
 * @param providerConfig 供应商配置
 * @returns 是否匿名
 */
export function isProviderAnonymous(providerConfig: any): boolean {
  return providerConfig?.isAnonymous === true;
}
