/**
 * OneAPI 模型信息结构
 */
export interface OneAPIModelInfo {
  key: string;
  name: string;
  supplier: string;
  tags: string[];
  illustrate: string;
  show_order: number;
}

/**
 * OneAPI 用户组结构
 */
export interface OneAPIModelGroup {
  DisplayName: string;
  GroupRatio: number;
  ModelPrice: Record<string, { isPrice: boolean; price: number }>;
}

/**
 * OneAPI 原始数据结构
 * 基于真实API返回的数据格式
 */
export interface OneAPIRawData {
  success: boolean;
  data: {
    model_info: Record<string, OneAPIModelInfo>;
    owner_by?: Record<string, unknown>;
    model_completion_ratio: Record<string, number>;
    group_special: Record<string, string[]>;
    model_group: Record<string, OneAPIModelGroup>;
  };
  message?: string;
}
