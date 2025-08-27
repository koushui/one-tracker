// 标准化的模型价格信息
export interface StandardizedModel {
  name: string;
  type: "tokens" | "times";
  rateBaseline: number; // 每 1k Tokens 的价格基数，通常中转设置为 0.002
  modelRate: number; // 模型基础倍率
  completeRate: number; // 补全倍率
  perPrice: number; // 按次收费时，每次调用的额度消耗基数，仅在按次计费有效
  supportGroups: string[]; // 模型支持的分组
}

// 标准化的分组信息
export interface StandardizedGroup {
  id: string; // 分组id，用于标识分组
  name: string; // 分组名称
  rate: number; // 分组使用倍率
}

// 标准化的源站信息
export interface StandardizedSource {
  name: string;
  url: string;
  type: string; // 源站类型，支持动态扩展
  rechargeRatio: number; // 充值比例，即 1货币单位能兑换多少该站点的余额值
}

// 用户偏好设置
export interface UserPreference {
  currency: string; // 货币单位，默认显示¥符号，用户可切换其他货币单位显示
}

// 完整的标准化记录
export interface StandardizedPricingRecord {
  source: StandardizedSource;
  preference: UserPreference;
  models: StandardizedModel[];
  groups: StandardizedGroup[];
}
