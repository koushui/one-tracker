import { ProviderParser } from "../interfaces";
import { StandardizedPricingRecord, StandardizedModel, StandardizedGroup } from "../../types/pricing";
import { OneAPIRawData } from "./types";

/**
 * OneAPI 解析器
 * 专门处理OneAPI标准格式的定价数据
 */
export class OneAPIParser implements ProviderParser<OneAPIRawData> {
  readonly type = "oneapi";

  constructor(
    private sourceName: string,
    private baseUrl: string,
    private rechargeRatio: number = 1,
  ) {}

  getApiPath(): string {
    return "/api/pricing";
  }

  private getFullUrl(): string {
    const url = new URL(this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl);
    return url.origin + this.getApiPath();
  }

  canParse(data: unknown): data is OneAPIRawData {
    if (!data || typeof data !== "object") return false;
    const d = data as any;

    // 必须有 success: true
    if (d.success !== true) return false;

    // 必须有 data 对象
    if (!d.data || typeof d.data !== "object") return false;

    // 必须有必要的字段
    return !!(d.data.model_group && d.data.model_completion_ratio && d.data.group_special);
  }

  parse(rawData: OneAPIRawData, rateBaseline: number = 0.002): StandardizedPricingRecord {
    if (!this.canParse(rawData)) {
      throw new Error("Invalid OneAPI data format");
    }

    const models: StandardizedModel[] = [];
    const groups = new Map<string, StandardizedGroup>();

    const { model_group, model_completion_ratio, group_special } = rawData.data;

    // 1. 创建所有用户组
    for (const [groupId, groupData] of Object.entries(model_group)) {
      const group: StandardizedGroup = {
        id: groupId,
        name: groupId,
        rate: groupData.GroupRatio,
      };
      groups.set(groupId, group);
    }

    // 2. 收集所有模型的定价信息
    const modelPricingMap = new Map<string, { groupId: string; price: number; isPerCall: boolean }[]>();

    for (const [groupId, groupData] of Object.entries(model_group)) {
      for (const [modelName, priceData] of Object.entries(groupData.ModelPrice)) {
        if (!modelPricingMap.has(modelName)) {
          modelPricingMap.set(modelName, []);
        }

        modelPricingMap.get(modelName)!.push({
          groupId,
          price: priceData.price,
          isPerCall: priceData.isPrice,
        });
      }
    }

    // 3. 为每个模型创建StandardizedModel，确保价格一致性
    for (const [modelName, pricingList] of modelPricingMap) {
      const completeRate = model_completion_ratio[modelName] ?? 1;
      const supportedGroups = group_special[modelName] || pricingList.map((p) => p.groupId);

      // 检查该模型在所有支持的分组中是否有一致的基准价格和计费类型
      const relevantPricing = pricingList.filter((p) => supportedGroups.includes(p.groupId));

      if (relevantPricing.length === 0) {
        console.warn(`模型 ${modelName} 没有找到相关分组的定价信息，跳过`);
        continue;
      }

      // 检查计费类型是否一致（全部按token计费或全部按次计费）
      const firstType = relevantPricing[0].isPerCall;
      const hasConsistentType = relevantPricing.every((p) => p.isPerCall === firstType);

      if (!hasConsistentType) {
        console.warn(`模型 ${modelName} 在不同分组中有不一致的计费类型，跳过`);
        continue;
      }

      // 检查基准价格是否一致
      const firstPrice = relevantPricing[0].price;
      const hasConsistentPrice = relevantPricing.every((p) => p.price === firstPrice);

      if (!hasConsistentPrice) {
        console.warn(
          `模型 ${modelName} 在不同分组中有不一致的基准价格：${relevantPricing.map((p) => `${p.groupId}:${p.price}`).join(", ")}，跳过`,
        );
        continue;
      }

      // 价格一致，创建标准化模型
      const basePricing = relevantPricing[0];

      const model: StandardizedModel = {
        name: modelName,
        type: basePricing.isPerCall ? "times" : "tokens",
        rateBaseline: rateBaseline, // 使用供应商配置的基准价格（每1K tokens的用户货币单位）
        modelRate: basePricing.price, // API返回的模型倍率
        completeRate,
        perPrice: basePricing.isPerCall ? basePricing.price : 1,
        supportGroups: supportedGroups,
      };

      models.push(model);
    }

    return {
      source: {
        name: this.sourceName,
        url: this.getFullUrl(),
        type: this.type,
        rechargeRatio: this.rechargeRatio,
      },
      preference: { currency: "CNY" },
      models,
      groups: Array.from(groups.values()),
    };
  }
}
