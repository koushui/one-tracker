import { OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { generateUserApiKey, encryptApiKey, decryptApiKey } from "../utils/encryption";
import { authMiddleware } from "../middleware/auth";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import type { Bindings } from "../types";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as drizzleSchema from "../db/schema";

type Variables = {
  db: DrizzleD1Database<typeof drizzleSchema>;
  user: typeof drizzleSchema.users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

app.use("/*", authMiddleware);

// 用户信息响应模式
const UserInfoSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  apiKey: z.string(),
  createdAt: z.string(),
});

// 更新API密钥请求模式
const UpdateApiKeySchema = z.object({
  regenerate: z.boolean().optional(),
});

// 获取用户信息路由
const getUserInfoRoute = createRoute({
  method: "get",
  path: "/info",
  summary: "获取用户信息",
  responses: {
    200: {
      description: "用户信息",
      content: {
        "application/json": {
          schema: UserInfoSchema,
        },
      },
    },
  },
});

// 更新API密钥路由
const updateApiKeyRoute = createRoute({
  method: "post",
  path: "/api-key",
  summary: "更新用户API密钥",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateApiKeySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "更新成功",
      content: {
        "application/json": {
          schema: z.object({
            apiKey: z.string(),
          }),
        },
      },
    },
  },
});

app
  .openapi(getUserInfoRoute, async (c) => {
    const user = c.get("user");

    return c.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      apiKey: user.apiKey,
      createdAt: user.createdAt.toISOString(),
    });
  })
  .openapi(updateApiKeyRoute, async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    const { regenerate } = await c.req.json();

    if (regenerate) {
      const newApiKey = generateUserApiKey();

      await db
        .update(users)
        .set({
          apiKey: newApiKey,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return c.json({
        apiKey: newApiKey,
      });
    }

    return c.json({
      apiKey: user.apiKey,
    });
  });

export default app;
