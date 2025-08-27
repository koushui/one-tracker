/**
 * OneHub 用户分组映射结构
 */
export interface OneHubGroupMapData {
  success: boolean;
  data: {
    [groupSymbol: string]: {
      id: number;
      symbol: string;
      name: string;
      ratio: number;
      api_rate: number;
      public: boolean;
      enable: boolean;
    };
  };
  message?: string;
}

/**
 * OneHub 原始数据结构
 * 基于真实API返回的数据格式
 */
export interface OneHubRawData {
  success: boolean;
  data: {
    [modelName: string]: {
      groups: string[];
      owned_by: string;
      price: {
        model: string;
        type: "tokens" | "times";
        channel_type: number;
        input: number;
        output: number;
        locked: boolean;
        extra_ratios?: {
          reasoning_tokens?: number;
        };
      };
    };
  };
  message?: string;
}
