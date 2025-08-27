# 🔧 故障排除指南

本指南收集了 NekroEdge 开发和部署过程中的常见问题及解决方案。

## 🚨 开发环境问题

### 启动失败

#### 问题：`pnpm dev` 启动失败

**错误信息**: `Module not found` 或 `Cannot resolve dependency`

**解决方案**:

```bash
# 1. 清理依赖缓存
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 2. 检查 Node.js 版本
node --version  # 需要 >= 18

# 3. 检查 pnpm 版本
pnpm --version  # 需要 >= 8
```

### 热重载问题

#### 问题：热重载不工作

**症状**: 修改代码后浏览器不自动更新

**解决方案**:

1. **确认访问地址**: 必须使用 `localhost:5175`，不是 `8787`
2. **检查 WebSocket 连接**: 在浏览器控制台查看是否有连接错误
3. **重启开发服务器**:
   ```bash
   # Ctrl+C 停止服务器
   pnpm dev  # 重新启动
   ```
4. **检查防火墙设置**: 确保 5175 端口未被阻止

### 数据库问题

#### 问题：数据库连接失败

**错误信息**: `D1_ERROR` 或 `Database not found`

**解决方案**:

```bash
# 1. 重新初始化本地数据库
rm -rf .wrangler/state
pnpm db:migrate

# 2. 检查数据库配置
cat wrangler.jsonc  # 确认配置正确

# 3. 手动创建迁移
pnpm db:generate
pnpm db:migrate
```

#### 问题：迁移文件冲突

**解决方案**:

```bash
# 1. 备份数据
cp .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite backup/

# 2. 重置迁移
rm -rf drizzle/*
pnpm db:generate

# 3. 重新应用迁移
pnpm db:migrate
```

## 🏗️ 构建问题

### Vite 构建错误

#### 问题：模块解析失败

**错误信息**: `Failed to resolve import` 或 `Cannot find module`

**解决方案**:

```typescript
// frontend/vite.config.mts
export default defineConfig({
  ssr: {
    noExternal: [
      "react-router-dom",
      "@mui/material",
      "@mui/system",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
      // 添加导致问题的模块
    ],
  },
});
```

### Wrangler 构建错误

#### 问题：esbuild 打包失败

**错误信息**: `Build failed` 或 `Transform failed`

**解决方案**:

```jsonc
// wrangler.jsonc
{
  "build": {
    "command": "pnpm build",
  },
  "compatibility_flags": ["nodejs_compat"],
  "node_compat": true,
}
```

### 报告问题

如果以上方法都无法解决问题，请：

1. **收集信息**:
   - 错误信息截图
   - 相关日志输出
   - 系统环境信息
   - 复现步骤

2. **提交 Issue**:
   - [GitHub Issues](https://github.com/KroMiose/nekro-edge-template/issues)
   - 提供详细的问题描述和环境信息

3. **社区讨论**:
   - [GitHub Discussions](https://github.com/KroMiose/nekro-edge-template/discussions)
