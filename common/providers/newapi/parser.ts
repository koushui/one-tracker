import { ProviderParser } from "../interfaces";
import { StandardizedPricingRecord, StandardizedModel } from "../../types/pricing";
import { NewAPIRawData } from "./types";

/**
 * NewAPI 系列解析器
 */
export class NewAPIParser implements ProviderParser<NewAPIRawData> {
  readonly type = "newapi";

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

  canParse(data: unknown): data is NewAPIRawData {
    if (!data || typeof data !== "object") return false;
    const d = data as any;
    return d.success === true && Array.isArray(d.data) && typeof d.group_ratio === "object";
  }

  parse(rawData: NewAPIRawData, rateBaseline: number = 0.002): StandardizedPricingRecord {
    if (!this.canParse(rawData)) {
      throw new Error("Invalid NewAPI data format");
    }

    const models: StandardizedModel[] = [];
    const groups = new Map<string, any>();

    for (const modelData of rawData.data) {
      const model: StandardizedModel = {
        name: modelData.model_name,
        type: "tokens",
        rateBaseline: rateBaseline, // 使用供应商配置的基准价格（每1K tokens的用户货币单位）
        modelRate: modelData.model_ratio, // API返回的模型倍率
        completeRate: modelData.completion_ratio,
        perPrice: 1,
        supportGroups: modelData.enable_groups || [],
      };
      models.push(model);

      // 收集模型支持的分组
      modelData.enable_groups?.forEach((groupName: string) => {
        if (!groups.has(groupName)) {
          const groupRate = rawData.group_ratio[groupName] || 1;
          groups.set(groupName, { id: groupName, name: groupName, rate: groupRate });
        }
      });
    }

    // 添加自动分组
    rawData.auto_groups?.forEach((groupName: string) => {
      if (!groups.has(groupName)) {
        const groupRate = rawData.group_ratio[groupName] || 1;
        groups.set(groupName, { id: groupName, name: groupName, rate: groupRate });
      }
    });

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
