import { z } from "@hono/zod-openapi";

export const PricingSourceConfigSchema = z.object({
  name: z.string().min(1).openapi({
    example: "Nekro API",
    description: "供应商名称",
  }),
  url: z.string().url().openapi({
    example: "https://api.nekro.ai",
    description: "API基础地址（不含路径）",
  }),
  type: z.string().min(1).openapi({
    example: "onehub",
    description: "供应商类型",
  }),
  rechargeRatio: z.number().positive().openapi({
    example: 1,
    description: "充值比例",
  }),
  rateBaseline: z.number().positive().optional().openapi({
    example: 0.002,
    description: "基础价格基准（每1K Token），默认0.002",
  }),
});

export const FetchPricingRequestSchema = z.object({
  sources: z.array(PricingSourceConfigSchema).min(1).openapi({
    description: "价格源配置列表",
  }),
});

export const StandardizedSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  rechargeRatio: z.number(),
});

export const ModelSchema = z.object({
  name: z.string(),
  type: z.enum(["tokens", "times"]),
  rateBaseline: z.number(),
  modelRate: z.number(),
  completeRate: z.number(),
  perPrice: z.number(),
  supportGroups: z.array(z.string()),
});

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  rate: z.number(),
});

export const StandardizedPricingRecordSchema = z.object({
  source: StandardizedSourceSchema,
  preference: z.object({
    currency: z.string(),
  }),
  models: z.array(ModelSchema),
  groups: z.array(GroupSchema),
});

export const FetchPricingResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(StandardizedPricingRecordSchema),
  errors: z.array(z.string()).optional(),
});

export const ErrorSchema = z.object({
  code: z.number().openapi({
    example: 400,
  }),
  message: z.string().openapi({
    example: "Bad Request",
  }),
});
