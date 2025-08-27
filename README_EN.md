# One Tracker

中文版 | [English](README_EN.md)

> 🎯 **Comprehensive AI Model Price Comparison and Tracking Platform - Easily Find the Most Cost-Effective AI Services**

[![Deployment Status](https://img.shields.io/badge/Deployment-Online-brightgreen)](https://tracker.nekro.ai/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![QQ Group 1](<https://img.shields.io/badge/QQ_Group1-636925153(Nearly_Full)-12B7F3?style=flat-square&logo=tencentqq>)](https://qm.qq.com/q/eT30LxDcSA) [![QQ Group 2](<https://img.shields.io/badge/QQ_Group2-679808796(New)-12B7F3?style=flat-square&logo=tencentqq>)](https://qm.qq.com/q/ZQ6QHdkXu0) [![Discord](https://img.shields.io/badge/Discord-Join_Channel-5865F2?style=flat-square&logo=discord)](https://discord.gg/eMsgwFnxUB)

**One Tracker** is an open-source large language model price comparison platform deployed on Cloudflare. It's specifically designed for AI developers and enterprise users, providing a unified parsing engine that allows you to **compare prices from multiple LLM providers** in real-time, including mainstream proxy platforms like OneAPI, NewAPI, OneHub, helping you find the most cost-effective LLM services.

## ✨ Core Values

- **🔍 Multi-source Price Aggregation**: Support for OneHub, NewAPI, OneAPI and other proxy platforms, automatically parsing price data from different APIs
- **📊 Intelligent Price Standardization**: Calculate real token costs based on recharge ratios, model rates, group rates and other parameters
- **⚡ Intelligent Provider Selection**: Automatically select optimal providers for each model, support manual adjustment and batch operations, with persistent selection storage
- **📈 Advanced Filtering & Analysis**: Provide multi-dimensional filtering, provider overview statistics, anonymous display mode to meet different analysis needs
- **🚀 Global Acceleration**: Based on Cloudflare's global network, providing low-latency, highly available access for your price queries
- **🌍 Open Source & Controllable**: Project is completely open source, you can deploy, modify and extend it yourself, with complete control over data and services

## 🚀 Quick Start (3 Steps)

### 1. Access Price Comparison Page

Visit **[https://tracker.nekro.ai/pricing](https://tracker.nekro.ai/pricing)** to use the complete price comparison features without registration.

### 2. Configure Provider Sources

Configure the API proxy platforms you want to compare:

- **Provider Name**: Custom display name (e.g., "Provider A (OneHub)")
- **Provider Address**: Provider address (e.g., `https://api.example.com`)
- **Provider Type**: Select corresponding parser (onehub/newapi/oneapi)
- **Recharge Ratio**: Site credits you can purchase with 1 currency unit (e.g., 1 yuan = 2 site credits, then enter 2)
- **Model Filtering**: Support blacklist/whitelist mode to filter specific models

### 3. Intelligent Price Analysis

After clicking "Fetch Prices", the system will automatically:

- Parse and standardize price data from each provider
- Intelligently select optimal providers and groups for each model
- Provide transparent price calculation formulas and parameter display
- Support multi-dimensional filtering, sorting and batch operations

🎉 **Done!** Now you can compare prices from major LLM providers in real-time and intelligently select the most cost-effective service combinations.

## 🛠️ Tech Stack

- **Backend**: [Hono](https://hono.dev/) on [Cloudflare Workers](https://workers.cloudflare.com/) - Lightweight, fast edge computing backend
- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) on [Cloudflare Pages](https://pages.cloudflare.com/) - Modern, efficient frontend development experience
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team/) - Type-safe serverless SQL database
- **UI**: [Material-UI](https://mui.com/) - Mature, beautiful React component library
- **Authentication**: GitHub OAuth

## 📊 Supported Provider Types

| Provider Type | Parser   | Supported Features                             |
| ------------- | -------- | ---------------------------------------------- |
| OneHub        | `onehub` | Group pricing, Token pricing, per-call pricing |
| NewAPI        | `newapi` | Group pricing, Token pricing, per-call pricing |
| OneAPI        | `oneapi` | Group pricing, Token pricing, per-call pricing |

## 📚 Documentation

We provide comprehensive project documentation and development guides:

- [**Project Requirements Document (PRD)**](./REQUIREMENTS.md) - In-depth understanding of project design philosophy, functional architecture and technical implementation details
- [**Installation Guide**](./docs/INSTALLATION.md) - Detailed environment setup and configuration instructions
- [**Development Guide**](./docs/DEVELOPMENT.md) - Daily development workflows and best practices
- [**API Guide**](./docs/API_GUIDE.md) - Complete backend API development process
- [**Deployment Guide**](./docs/DEPLOYMENT.md) - Production environment deployment process

## 🔗 Related Projects

If you're looking for a highly scalable AI Agent framework, we recommend checking out our other project:

**[Nekro Agent](https://github.com/KroMiose/nekro-agent)** - A multi-user cross-platform chatbot framework that combines code execution capabilities with high scalability. It supports sandbox-driven, visual interface, highly scalable plugin system, and natively supports multiple platforms such as QQ, Discord, Minecraft, Bilibili Live, etc. If you need to build intelligent chatbots or automated Agent systems, Nekro Agent will be your ideal choice.

---

## 🤝 Contributing

Welcome to participate in the project in the following ways:

- 🐛 **Report Issues**: [Submit bugs in GitHub Issues](https://github.com//NekroAI/one-tracker/issues)
- 💡 **Suggest Ideas**: [Share your thoughts in GitHub Discussions](https://github.com//NekroAI/one-tracker/discussions)
- 🔧 **Contribute Code**: Check our [Development Guide](./docs/DEVELOPMENT.md) to start contributing
- ⭐ If you find this project helpful, please give us a **Star**!

## 📄 License

This project is open source under the [MIT License](./LICENSE).

## ⭐ Star History

![Star History Chart](https://api.star-history.com/svg?repos=/NekroAI/one-tracker&type=Date)
