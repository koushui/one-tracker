import { ExtendedProviderParser } from "../interfaces";
import { StandardizedPricingRecord, StandardizedModel, StandardizedGroup } from "../../types/pricing";
import { OneHubRawData, OneHubGroupMapData } from "./types";

/**
 * OneHub 解析器
 * 专门处理OneHub标准格式的定价数据
 * 需要同时获取模型数据和分组数据
 */
export class OneHubParser implements ExtendedProviderParser<OneHubRawData, OneHubGroupMapData> {
  readonly type = "onehub";

  constructor(
    private sourceName: string,
    private baseUrl: string,
    private rechargeRatio: number = 1,
  ) {}

  getApiPath(): string {
    return "/api/available_model";
  }

  getExtraDataApiPath(): string {
    return "/api/user_group_map";
  }

  getGroupMapApiPath(): string {
    return this.getExtraDataApiPath();
  }

  private getFullUrl(): string {
    const url = new URL(this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl);
    return url.origin + this.getApiPath();
  }

  getGroupMapUrl(): string {
    const url = new URL(this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl);
    return url.origin + this.getGroupMapApiPath();
  }

  canParse(data: unknown): data is OneHubRawData {
    if (!data || typeof data !== "object") return false;
    const d = data as any;
    return d.success === true && typeof d.data === "object" && d.data !== null;
  }

  parse(
    rawData: OneHubRawData,
    groupMapData: OneHubGroupMapData,
    rateBaseline: number = 0.002,
  ): StandardizedPricingRecord {
    if (!this.canParse(rawData)) {
      throw new Error("Invalid OneHub data format");
    }

    if (!groupMapData?.data) {
      throw new Error("OneHub requires group map data - call getGroupMapUrl() to get the additional API endpoint");
    }

    const models: StandardizedModel[] = [];
    const groups = new Map<string, StandardizedGroup>();

    // 处理模型数据
    for (const [modelName, modelData] of Object.entries(rawData.data)) {
      const { price, groups: modelGroups } = modelData;

      // 根据类型计算补全倍率和模型倍率
      let completeRate: number;
      let modelRate: number;
      let perPrice: number;

      if (price.type === "tokens") {
        // OneHub返回的是每 (1/rateBaseline) tokens的站点余额价格
        modelRate = price.input;
        completeRate = price.output / price.input;
        perPrice = 1;
      } else {
        modelRate = price.input;
        completeRate = price.output / price.input;
        perPrice = price.input * rateBaseline + price.output * rateBaseline;
      }

      const model: StandardizedModel = {
        name: modelName,
        type: price.type,
        rateBaseline: rateBaseline, // 使用用户配置的基准价格
        modelRate: modelRate, // API价格相对于基准价格的倍率
        completeRate,
        perPrice,
        supportGroups: modelGroups,
      };

      models.push(model);

      // 收集分组信息
      modelGroups.forEach((groupName) => {
        if (!groups.has(groupName)) {
          const groupData = groupMapData.data[groupName];
          if (!groupData) {
            throw new Error(`Group "${groupName}" not found in group map data`);
          }

          const groupInfo: StandardizedGroup = {
            id: groupName,
            name: groupData.name,
            rate: groupData.ratio,
          };

          groups.set(groupName, groupInfo);
        }
      });
    }

    return {
      source: {
        name: this.sourceName,
        url: this.getFullUrl(),
        type: this.type,
        rechargeRatio: this.rechargeRatio,
      },
      preference: {
        currency: "CNY",
      },
      models,
      groups: Array.from(groups.values()),
    };
  }
}
