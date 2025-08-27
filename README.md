# One Tracker

[English](README_EN.md) | 中文版

> 🎯 **全方位AI模型价格对比与追踪平台 - 让您轻松找到最具性价比的AI服务**

[![部署状态](https://img.shields.io/badge/部署-在线-brightgreen)](https://ot.nekro.ai/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![QQ群1](<https://img.shields.io/badge/QQ群1-636925153(将满)-12B7F3?style=flat-square&logo=tencentqq>)](https://qm.qq.com/q/eT30LxDcSA) [![QQ群2](<https://img.shields.io/badge/QQ群2-679808796(新开)-12B7F3?style=flat-square&logo=tencentqq>)](https://qm.qq.com/q/ZQ6QHdkXu0) [![Discord](https://img.shields.io/badge/Discord-加入频道-5865F2?style=flat-square&logo=discord)](https://discord.gg/eMsgwFnxUB)

**One Tracker** 是一个部署在 Cloudflare 上的开源大模型价格比较平台。它专为AI开发者和企业用户设计，通过统一的解析引擎，让您可以实时比较**多个大模型供应商的价格**，包括 OneAPI、NewAPI、OneHub 等主流中转平台，帮助您找到最具性价比的大模型服务。

## ✨ 核心价值

- **🔍 多源站价格聚合**: 支持 OneHub、NewAPI、OneAPI 等多种中转站格式，自动解析不同API的价格数据
- **📊 智能价格标准化**: 基于充值比例、模型倍率、分组倍率等参数，统一计算真实Token成本
- **⚡ 智能供应商选择**: 为每个模型自动选择最优供应商，支持手动调整和批量操作，选择持久化存储
- **📈 高级筛选与分析**: 提供多维度筛选、供应商概览统计、匿名显示等功能，满足不同分析需求
- **🚀 全球加速**: 基于 Cloudflare 的全球网络，为您的价格查询提供低延迟、高可用的访问体验
- **🌍 开源可控**: 项目完全开源，您可以自行部署、修改和扩展，数据和服务完全由您掌控

## 🚀 快速开始 (3步)

### 1. 访问比价页面

访问 **[https://ot.nekro.ai/pricing](https://ot.nekro.ai/pricing)**，无需注册即可使用完整比价功能。

### 2. 配置供应商源站

在页面中配置您需要比价的API中转站：

- **供应商名称**: 自定义显示名称 (例如: "供应商A (OneHub)")
- **供应商地址**: 供应商地址 (例如: `https://api.example.com`)
- **供应商类型**: 选择对应的解析器 (onehub/newapi/oneapi)
- **充值比例**: 1 货币单位可在该供应商购买的站点额度 (例如: 1 元 = 2 站点额度，则填写 2)
- **模型过滤**: 支持黑白名单模式过滤特定模型

### 3. 智能比价分析

点击"拉取价格"后，系统会自动：

- 解析各供应商的价格数据并标准化计算
- 为每个模型智能选择最优供应商和分组
- 提供透明的价格计算公式和参数展示
- 支持多维度筛选、排序和批量操作

🎉 **完成！** 现在您可以实时比较各大AI模型供应商的价格，智能选择最优惠的服务组合。

## 🛠️ 技术栈

- **后端**: [Hono](https://hono.dev/) on [Cloudflare Workers](https://workers.cloudflare.com/) - 轻量、快速的边缘计算后端
- **前端**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) on [Cloudflare Pages](https://pages.cloudflare.com/) - 现代、高效的前端开发体验
- **数据库**: [Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team/) - 类型安全的无服务器 SQL 数据库
- **UI**: [Material-UI](https://mui.com/) - 成熟、美观的 React 组件库
- **认证**: GitHub OAuth

## 📊 支持的供应商类型

| 供应商类型 | 解析器   | 支持特性                       |
| ---------- | -------- | ------------------------------ |
| OneHub     | `onehub` | 分组定价、Token 定价、按次定价 |
| NewAPI     | `newapi` | 分组定价、Token 定价、按次定价 |
| OneAPI     | `oneapi` | 分组定价、Token 定价、按次定价 |

## 📚 文档

我们提供了完整的项目文档和开发指南：

- [**项目需求文档 (PRD)**](./REQUIREMENTS.md) - 深入了解项目的设计理念、功能架构和技术实现细节
- [**安装指南**](./docs/INSTALLATION.md) - 详细的环境搭建和配置说明
- [**开发指南**](./docs/DEVELOPMENT.md) - 日常开发工作流和最佳实践
- [**API 指南**](./docs/API_GUIDE.md) - 后端 API 开发完整流程
- [**部署指南**](./docs/DEPLOYMENT.md) - 生产环境部署流程

## 🔗 相关项目

如果您正在寻找一款高扩展性的 AI Agent 框架，我们推荐您关注我们的另一个项目：

**[Nekro Agent](https://github.com/KroMiose/nekro-agent)** - 一个集代码执行能力与高度可扩展性为一体的多人跨平台聊天机器人框架。支持沙盒驱动、可视化界面、高扩展性插件系统，原生支持 QQ、Discord、Minecraft、B站直播等多种平台。如果您需要构建智能聊天机器人或自动化 Agent 系统，Nekro Agent 将是您的理想选择。

---

## 🤝 参与贡献

欢迎通过以下方式参与项目：

- 🐛 **报告问题**: [在 GitHub Issues 中提交 Bug](https://github.com//NekroAI/one-tracker/issues)
- 💡 **提出建议**: [在 GitHub Discussions 中分享你的想法](https://github.com//NekroAI/one-tracker/discussions)
- 🔧 **贡献代码**: 查看我们的 [开发指南](./docs/DEVELOPMENT.md) 开始贡献
- ⭐ 如果你觉得这个项目对你有帮助，请给一个 **Star**！

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

## ⭐ Star 趋势

![Star History Chart](https://api.star-history.com/svg?repos=/NekroAI/one-tracker&type=Date)
