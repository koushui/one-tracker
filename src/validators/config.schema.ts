import { z } from "zod";
import {
  createRoute,
  OpenAPIHono,
} from "@hono/zod-openapi";

const zodOpenAPIRequest = (req: any) => req;
const zodOpenAPIResponse = (res: any) => res;

export const ProviderConfigSchema = z.object({
  name: z.string().min(1, "提供商名称不能为空").max(50, "名称不能超过50个字符"),
  baseUrl: z.string().url("请输入有效的 URL"),
  apiKey: z.string().min(1, "API Key 不能为空"),
});

export const ModelMappingSchema = z.object({
  id: z.string(),
  keyword: z.string().min(1, "关键字不能为空").max(50, "关键字不能超过50个字符"),
  targetModel: z.string().min(1, "目标模型不能为空").max(100, "目标模型名称不能超过100个字符"),
  isEnabled: z.boolean(),
});

export const UpdateUserConfigSchema = z.object({
  provider: ProviderConfigSchema.optional(),
  mappings: z.array(ModelMappingSchema.omit({ id: true })).optional(),
});

export const UserConfigSchema = z.object({
  provider: ProviderConfigSchema.nullable(),
  mappings: z.array(ModelMappingSchema),
});

// --- OpenAPI Routes ---

export const getUserConfigRoute = createRoute({
  method: "get",
  path: "/config",
  summary: "获取用户配置",
  responses: {
    200: zodOpenAPIResponse({
      description: "成功获取用户配置",
      schema: UserConfigSchema,
    }),
  },
});

export const updateUserConfigRoute = createRoute({
  method: "put",
  path: "/config",
  summary: "更新用户配置",
  request: zodOpenAPIRequest({
    body: {
      content: {
        "application/json": {
          schema: UpdateUserConfigSchema,
        },
      },
    },
  }),
  responses: {
    200: zodOpenAPIResponse({
      description: "成功更新用户配置",
      schema: UserConfigSchema,
    }),
  },
});

export const getModelsRoute = createRoute({
  method: "get",
  path: "/config/models",
  summary: "获取远程模型列表",
  responses: {
    200: zodOpenAPIResponse({
      description: "成功获取模型列表",
      schema: z.array(z.object({ id: z.string(), name: z.string() })),
    }),
    400: zodOpenAPIResponse({
      description: "配置错误",
      schema: z.object({ success: z.boolean(), message: z.string() }),
    }),
  },
});
