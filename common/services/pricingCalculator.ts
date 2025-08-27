import type { StandardizedPricingRecord, StandardizedModel, StandardizedGroup } from "../types/pricing";

/**
 * 计算后的价格信息接口
 * 统一使用1K tokens作为基准单位，货币单位由用户的rechargeRatio决定
 */
export interface CalculatedPrice {
  modelName: string;
  providerName: string;
  type: "tokens" | "times";
  pricePer1KInput: number; // 每1K tokens输入价格（用户货币单位）
  pricePer1KOutput: number; // 每1K tokens输出价格（用户货币单位）
  perCallPrice?: number; // 按次计费价格（用户货币单位）
  userGroupId: string;
  userGroupName: string;
  userGroupRate: number;
  // 添加原始模型参数用于公式显示
  originalModelParams: {
    rateBaseline: number;
    modelRate: number;
    completeRate: number;
    perPrice?: number;
  };
  source: {
    name: string;
    url: string;
    type: string;
    rechargeRatio: number;
  };
}

/**
 * 价格范围信息接口
 */
export interface PriceRange {
  min: number;
  max: number;
  minProvider: string;
  maxProvider: string;
  minUserGroup?: string;
  maxUserGroup?: string;
}

/**
 * 分组启用状态接口
 */
export interface GroupState {
  groupId: string;
  groupName: string;
  providerName: string;
  rate: number;
  enabled: boolean;
}

/**
 * 价格计算器服务类
 * 负责所有与价格相关的计算逻辑，确保前后端计算一致性
 */
export class PricingCalculator {
  /**
   * 计算单个模型的价格
   * @param model 模型信息
   * @param group 分组信息
   * @param source 源站信息
   * @returns 计算后的价格信息
   */
  static calculateModelPrice(
    model: StandardizedModel,
    group: StandardizedGroup,
    source: StandardizedPricingRecord["source"],
  ): CalculatedPrice {
    const basePrice: CalculatedPrice = {
      modelName: model.name,
      providerName: source.name,
      type: model.type,
      pricePer1KInput: 0,
      pricePer1KOutput: 0,
      userGroupId: group.id,
      userGroupName: group.name,
      userGroupRate: group.rate,
      // 添加原始模型参数
      originalModelParams: {
        rateBaseline: model.rateBaseline,
        modelRate: model.modelRate,
        completeRate: model.completeRate,
        perPrice: model.perPrice,
      },
      source: {
        name: source.name,
        url: source.url,
        type: source.type,
        rechargeRatio: source.rechargeRatio,
      },
    };

    if (model.type === "tokens") {
      // 统一的1K tokens价格计算公式：rateBaseline × modelRate × groupRate ÷ rechargeRatio
      const pricePer1KInput = (model.rateBaseline * model.modelRate * group.rate) / source.rechargeRatio;
      const pricePer1KOutput =
        (model.rateBaseline * model.modelRate * model.completeRate * group.rate) / source.rechargeRatio;

      // debug
      let debug_text = "--------------------------------\n";
      debug_text += `供应商: ${source.name}, 模型名称: ${model.name}\n`;
      debug_text += `价格参数 -> 基准价格: ${model.rateBaseline}, 模型倍率: ${model.modelRate}, 分组倍率: ${group.rate}, 充值比例: ${source.rechargeRatio}\n`;
      debug_text += `价格计算(1K输入): ${model.rateBaseline} * ${model.modelRate} * ${group.rate} / ${source.rechargeRatio} = ${pricePer1KInput}\n`;
      debug_text += `价格计算(1K输出): ${model.rateBaseline} * ${model.modelRate} * ${model.completeRate} * ${group.rate} / ${source.rechargeRatio} = ${pricePer1KOutput}\n`;
      debug_text += "--------------------------------\n";
      // console.log(debug_text);

      basePrice.pricePer1KInput = pricePer1KInput;
      basePrice.pricePer1KOutput = pricePer1KOutput;
    } else {
      // 按次收费
      basePrice.perCallPrice = model.perPrice;
    }

    return basePrice;
  }

  /**
   * 动态计算指定分组的模型价格
   * @param model 标准化模型
   * @param source 数据源信息
   * @param groupRate 分组倍率
   * @returns 计算后的价格信息（不包含分组状态）
   */
  static calculateDynamicPrice(
    model: StandardizedModel,
    source: StandardizedPricingRecord["source"],
    groupRate: number,
  ): { inputPrice: number; outputPrice: number; perCallPrice: number } {
    if (model.type === "tokens") {
      const inputPrice = (model.rateBaseline * model.modelRate * groupRate) / source.rechargeRatio;
      const outputPrice =
        (model.rateBaseline * model.modelRate * model.completeRate * groupRate) / source.rechargeRatio;
      return {
        inputPrice,
        outputPrice,
        perCallPrice: 0,
      };
    } else {
      // 按次收费
      const perCallPrice = ((model.perPrice || 1) * groupRate) / source.rechargeRatio;
      return {
        inputPrice: 0,
        outputPrice: 0,
        perCallPrice,
      };
    }
  }

  /**
   * 批量计算跨站价格对比
   * @param data 标准化价格记录数组
   * @param enabledGroups 启用的分组状态
   * @returns 计算后的价格数组
   */
  static calculateCrossSitePrices(data: StandardizedPricingRecord[], enabledGroups: GroupState[]): CalculatedPrice[] {
    const prices: CalculatedPrice[] = [];

    data.forEach((record) => {
      record.models.forEach((model) => {
        // 获取该供应商启用的分组
        const enabledGroupsForProvider = enabledGroups.filter(
          (eg) => eg.providerName === record.source.name && eg.enabled,
        );

        if (enabledGroupsForProvider.length === 0) return; // 该供应商没有启用的分组

        // 找到该模型支持的最低价格分组
        const availableGroups = record.groups.filter(
          (group) =>
            enabledGroupsForProvider.some((eg) => eg.groupName === group.name) &&
            model.supportGroups.includes(group.id),
        );

        if (availableGroups.length === 0) return; // 该模型在该供应商没有可用的分组

        // 选择倍率最低的分组（价格最优惠）
        const bestGroup = availableGroups.reduce((prev, current) => (prev.rate < current.rate ? prev : current));

        // 计算该模型在该供应商的最优价格
        const calculatedPrice = this.calculateModelPrice(model, bestGroup, record.source);
        prices.push(calculatedPrice);
      });
    });

    return prices;
  }

  /**
   * 获取指定模型的价格范围
   * @param modelName 模型名称
   * @param type 收费类型
   * @param calculatedPrices 计算后的价格数组
   * @returns 价格范围信息
   */
  static getPriceRange(modelName: string, type: "tokens" | "times", calculatedPrices: CalculatedPrice[]): PriceRange {
    const modelPrices = calculatedPrices.filter((p) => p.modelName === modelName && p.type === type);

    if (modelPrices.length === 0) {
      return { min: 0, max: 0, minProvider: "", maxProvider: "" };
    }

    if (type === "tokens") {
      const inputPrices = modelPrices.map((p) => ({
        price: p.pricePer1KInput,
        provider: p.providerName,
        userGroup: p.userGroupName,
      }));
      const min = Math.min(...inputPrices.map((p) => p.price));
      const max = Math.max(...inputPrices.map((p) => p.price));
      const minProvider = inputPrices.find((p) => p.price === min)?.provider || "";
      const maxProvider = inputPrices.find((p) => p.price === max)?.provider || "";
      const minUserGroup = inputPrices.find((p) => p.price === min)?.userGroup;
      const maxUserGroup = inputPrices.find((p) => p.price === max)?.userGroup;

      return { min, max, minProvider, maxProvider, minUserGroup, maxUserGroup };
    } else {
      const callPrices = modelPrices.map((p) => ({
        price: p.perCallPrice || 0,
        provider: p.providerName,
        userGroup: p.userGroupName,
      }));
      const min = Math.min(...callPrices.map((p) => p.price));
      const max = Math.max(...callPrices.map((p) => p.price));
      const minProvider = callPrices.find((p) => p.price === min)?.provider || "";
      const maxProvider = callPrices.find((p) => p.price === max)?.provider || "";
      const minUserGroup = callPrices.find((p) => p.price === min)?.userGroup;
      const maxUserGroup = callPrices.find((p) => p.price === max)?.userGroup;

      return { min, max, minProvider, maxProvider, minUserGroup, maxUserGroup };
    }
  }

  /**
   * 初始化分组状态
   * @param data 标准化价格记录数组
   * @returns 分组状态数组
   */
  static initializeGroupStates(data: StandardizedPricingRecord[]): GroupState[] {
    const groups: GroupState[] = [];

    data.forEach((record) => {
      record.groups.forEach((group) => {
        // 创建唯一的分组标识
        const uniqueId = `${record.source.name}-${group.id}`;
        groups.push({
          groupId: uniqueId,
          groupName: group.name,
          providerName: record.source.name,
          rate: group.rate,
          enabled: true, // 默认启用所有分组
        });
      });
    });

    return groups;
  }

  /**
   * 格式化价格显示（统一1K tokens基准，货币单位无关）
   * @param pricePer1K 每1K tokens价格（用户货币单位）
   * @param showAs1M 是否显示为1M tokens单位
   * @param currencySymbol 货币符号，默认¥
   * @returns 格式化后的价格字符串
   */
  static formatPrice(pricePer1K: number, showAs1M: boolean = false, currencySymbol: string = "¥"): string {
    if (showAs1M) {
      return `${currencySymbol}${(pricePer1K * 1000).toFixed(4)}`;
    } else {
      return `${currencySymbol}${pricePer1K.toFixed(4)}`;
    }
  }
}
