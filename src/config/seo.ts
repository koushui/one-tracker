/**
 * 集中化的SEO配置文件
 * 其他开发者只需要修改这一个文件即可完成所有SEO配置
 */

export interface SEOConfig {
  // 基础信息
  siteName: string;
  siteUrl: string;
  title: string;
  description: string;
  keywords: string[];
  author: string;
  language: string;

  // 社交媒体
  ogImage: string;
  twitterHandle?: string;

  // 品牌色彩
  themeColor: string;

  // 页面配置
  pages: {
    [path: string]: {
      title?: string;
      description?: string;
      keywords?: string[];
      changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
      priority?: number;
    };
  };
}

/**
 * 默认SEO配置
 * 🎯 用户只需要修改这个配置对象即可完成整站SEO设置
 */
export const seoConfig: SEOConfig = {
  // 🌟 基础网站信息（必须修改）
  siteName: "One Tracker",
  siteUrl: "https://tracker.nekro.ai",
  title: "One Tracker - 全方位AI模型价格对比与追踪平台",
  description:
    "One Tracker是一个开源的AI模型价格对比和追踪平台，支持OneAPI、NewAPI、OneHub等多种供应商的实时价格监控，帮助用户找到最具性价比的AI模型服务。提供详细的价格分析、分组管理和智能推荐功能。",
  keywords: [
    "AI模型价格对比",
    "AI价格追踪",
    "模型价格监控",
    "OneAPI",
    "NewAPI",
    "OneHub",
    "AI模型比价",
    "价格分析",
    "成本优化",
    "Cloudflare",
    "Hono",
    "React",
    "开源",
    "OpenAI",
    "GPT",
  ],
  author: "One Tracker Team",
  language: "zh-CN",

  // 🎨 社交媒体和品牌
  ogImage: "/og-image.png", // 建议在 public 目录下创建一个 og-image.png
  themeColor: "#2E7D32", // Green color for tracking/monitoring theme

  // 📄 页面级配置
  pages: {
    "/": {
      title: "One Tracker - 首页 | AI模型价格对比追踪平台",
      description:
        "使用One Tracker实时监控和对比各大AI模型供应商的价格，包括OneAPI、NewAPI、OneHub等，帮助您找到最具性价比的AI服务。",
      changefreq: "daily",
      priority: 1.0,
    },
    "/pricing": {
      title: "价格对比 - One Tracker",
      description: "实时对比各供应商的AI模型价格，支持多维度筛选、排序和收藏功能，让您轻松找到最优惠的模型服务。",
      changefreq: "hourly",
      priority: 0.9,
    },
    "/dashboard": {
      title: "控制台 - One Tracker",
      description: "管理您的供应商配置、自定义价格基准、查看历史价格趋势和使用统计。",
      changefreq: "weekly",
      priority: 0.7,
    },
  },
};

/**
 * 生成页面的完整标题
 */
export function generatePageTitle(path: string): string {
  const pageConfig = seoConfig.pages[path];
  return pageConfig?.title || `${seoConfig.title} | ${seoConfig.siteName}`;
}

/**
 * 生成页面描述
 */
export function generatePageDescription(path: string): string {
  const pageConfig = seoConfig.pages[path];
  return pageConfig?.description || seoConfig.description;
}

/**
 * 生成页面关键词
 */
export function generatePageKeywords(path: string): string {
  const pageConfig = seoConfig.pages[path];
  const keywords = pageConfig?.keywords || seoConfig.keywords;
  return keywords.join(",");
}

/**
 * 生成完整的页面URL
 */
export function generatePageUrl(path: string): string {
  return `${seoConfig.siteUrl}${path === "/" ? "" : path}`;
}
