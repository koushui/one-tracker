import { StandardizedPricingRecord } from "../types/pricing";

/**
 * 供应商解析器接口
 * 遵循依赖倒置原则，不依赖具体实现
 */
export interface ProviderParser<T = unknown> {
  /**
   * 解析器标识符
   */
  readonly type: string;

  /**
   * API路径
   */
  getApiPath(): string;

  /**
   * 验证数据是否可被此解析器处理
   */
  canParse(data: unknown): data is T;

  /**
   * 解析原始数据为标准格式
   * @param rawData API返回的原始数据
   * @param rateBaseline 供应商基础价格基准，默认0.002
   */
  parse(rawData: T, rateBaseline?: number): StandardizedPricingRecord;
}

/**
 * 需要额外数据的供应商解析器接口
 * 用于需要多个API请求的解析器（如OneHub）
 */
export interface ExtendedProviderParser<T = unknown, E = unknown> extends Omit<ProviderParser<T>, "parse"> {
  /**
   * 解析原始数据为标准格式，支持额外数据
   * @param rawData API返回的原始数据
   * @param extraData 额外的API数据
   * @param rateBaseline 供应商基础价格基准，默认0.002
   */
  parse(rawData: T, extraData: E, rateBaseline?: number): StandardizedPricingRecord;

  /**
   * 获取额外数据的API路径
   */
  getExtraDataApiPath?(): string;
}

/**
 * 基础解析器接口（用于类型约束）
 */
export interface BaseParser {
  readonly type: string;
  getApiPath(): string;
  canParse(data: unknown): boolean;
}

/**
 * 供应商解析器工厂接口
 */
export interface ProviderParserFactory {
  /**
   * 创建解析器实例
   */
  createParser(type: string, sourceName: string, sourceUrl: string, rechargeRatio?: number): BaseParser | null;

  /**
   * 获取支持的类型列表
   */
  getSupportedTypes(): string[];

  /**
   * 检查是否支持指定类型
   */
  isSupported(type: string): boolean;

  /**
   * 注册新的解析器类型
   */
  registerParser<T>(type: string, parserClass: new (name: string, url: string, ratio: number) => BaseParser): void;
}
