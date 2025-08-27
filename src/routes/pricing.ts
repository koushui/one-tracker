import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { FetchPricingRequestSchema, FetchPricingResponseSchema, ErrorSchema } from "../validators/pricing.schema";
import { ProviderFactory } from "../../common/providers/factory";
import { ExtendedProviderParser, ProviderParser } from "../../common/providers/interfaces";
import type { Bindings } from "../types";
import type { StandardizedPricingRecord } from "../../common/types/pricing";

const FetchPricingRoute = createRoute({
  method: "post",
  path: "/fetch",
  request: {
    body: {
      content: {
        "application/json": {
          schema: FetchPricingRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(
              z.object({
                source: z.object({
                  name: z.string(),
                  url: z.string(),
                  type: z.string(),
                  rechargeRatio: z.number(),
                }),
                preference: z.object({
                  currency: z.string(),
                }),
                models: z.array(
                  z.object({
                    name: z.string(),
                    type: z.enum(["tokens", "times"]),
                    rateBaseline: z.number(),
                    modelRate: z.number(),
                    completeRate: z.number(),
                    perPrice: z.number(),
                    supportGroups: z.array(z.string()),
                  }),
                ),
                groups: z.array(
                  z.object({
                    id: z.string(),
                    name: z.string(),
                    rate: z.number(),
                  }),
                ),
              }),
            ),
            errors: z.array(z.string()).optional(),
          }),
        },
      },
      description: "成功获取价格数据",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "请求参数错误",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "服务器内部错误",
    },
  },
});

const app = new OpenAPIHono<{
  Bindings: Bindings;
  Variables: {
    db: DrizzleD1Database<typeof schema>;
  };
}>().openapi(FetchPricingRoute, async (c) => {
  const { sources } = c.req.valid("json");
  const providerFactory = new ProviderFactory();
  const results: StandardizedPricingRecord[] = [];
  const errors: string[] = [];

  // 并行处理所有请求以提高性能
  const promises = sources.map(async (sourceConfig) => {
    try {
      // 创建对应的解析器
      const parser = providerFactory.createParser(
        sourceConfig.type,
        sourceConfig.name,
        sourceConfig.url,
        sourceConfig.rechargeRatio,
      );

      if (!parser) {
        throw new Error(`Unsupported parser type: ${sourceConfig.type}`);
      }

      // 获取完整的API URL
      const fullUrl = sourceConfig.url.replace(/\/$/, "") + parser.getApiPath();

      // 发起HTTP请求
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "one-tracker-pricing-fetcher/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();

      // 检查是否为扩展解析器（需要额外数据）
      const isExtendedParser = "getExtraDataApiPath" in parser && typeof parser.getExtraDataApiPath === "function";

      let standardizedData: StandardizedPricingRecord;

      if (isExtendedParser) {
        // 扩展解析器需要获取额外数据
        const extendedParser = parser as ExtendedProviderParser;
        const extraApiPath = extendedParser.getExtraDataApiPath!();
        const extraUrl = sourceConfig.url.replace(/\/$/, "") + extraApiPath;

        // 获取额外数据
        const extraResponse = await fetch(extraUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "one-tracker-pricing-fetcher/1.0",
          },
        });

        if (!extraResponse.ok) {
          throw new Error(`Failed to fetch extra data from ${extraUrl}: HTTP ${extraResponse.status}`);
        }

        const extraData = await extraResponse.json();

        // 使用三个参数调用解析方法（包含rateBaseline）
        standardizedData = extendedParser.parse(rawData, extraData, sourceConfig.rateBaseline || 0.002);
      } else {
        // 标准解析器使用两个参数（包含rateBaseline）
        const standardParser = parser as ProviderParser;
        standardizedData = standardParser.parse(rawData, sourceConfig.rateBaseline || 0.002);
      }

      results.push(standardizedData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${sourceConfig.name}: ${error.message}` : `${sourceConfig.name}: Unknown error`;
      errors.push(errorMessage);
      console.error(`Pricing fetch error for ${sourceConfig.name}:`, error);
    }
  });

  // 等待所有请求完成
  await Promise.all(promises);

  return c.json(
    {
      success: results.length > 0,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    },
    200,
  );
});

export type PricingApiRoutes = typeof app;
export default app;
