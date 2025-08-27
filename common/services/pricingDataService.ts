import { StandardizedPricingRecord } from "../types/pricing";
import { ProviderFactory } from "../providers/factory";

export interface PricingSourceConfig {
  name: string;
  url: string;
  type: string; // 支持动态类型
  rechargeRatio: number;
  rateBaseline?: number; // 基础价格基准，默认0.002
  authHeader?: string;
  authQuery?: Record<string, string>;
}

interface FetchPricingResponse {
  success: boolean;
  data?: StandardizedPricingRecord[];
  errors?: string[];
}

export class PricingDataService {
  private providerFactory: ProviderFactory;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "/api/pricing") {
    this.providerFactory = new ProviderFactory();
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * 从源站获取数据并转换为标准格式
   */
  async fetchAndParse(config: PricingSourceConfig): Promise<StandardizedPricingRecord> {
    const results = await this.fetchMultipleSources([config]);
    if (results.length === 0) {
      throw new Error(`Failed to fetch data from ${config.name}`);
    }
    return results[0];
  }

  /**
   * 批量获取多个源站的数据
   */
  async fetchMultipleSources(configs: PricingSourceConfig[]): Promise<StandardizedPricingRecord[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sources: configs,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = (await response.json()) as { message?: string };
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Ignore JSON parsing errors for error response
        }
        throw new Error(errorMessage);
      }

      const result = (await response.json()) as FetchPricingResponse;

      if (!result.success && result.errors?.length) {
        console.warn("Some pricing sources failed:", result.errors);
      }

      return result.data || [];
    } catch (error) {
      console.error("Failed to fetch pricing data:", error);
      throw error;
    }
  }

  /**
   * 获取支持的源站类型
   */
  getSupportedTypes(): string[] {
    return this.providerFactory.getSupportedTypes();
  }

  /**
   * 检查是否支持指定类型
   */
  isSupported(type: string): boolean {
    return this.providerFactory.isSupported(type);
  }
}
