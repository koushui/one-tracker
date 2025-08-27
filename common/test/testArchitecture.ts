import { PricingDataService, PricingSourceConfig } from "../services/pricingDataService";

// 测试配置
const testConfigs: PricingSourceConfig[] = [];

async function testParsers() {
  const service = new PricingDataService();

  console.log("支持的解析器类型:", service.getSupportedTypes());

  for (const config of testConfigs) {
    console.log(`\n测试 ${config.name} (${config.type}):`);

    try {
      if (service.isSupported(config.type)) {
        const result = await service.fetchAndParse(config);
        console.log(`✅ 解析成功: ${result.models.length} 个模型, ${result.groups.length} 个分组`);
        console.log("源站信息:", result.source);
        console.log("模型示例:", result.models.slice(0, 2));
      } else {
        console.log(`❌ 不支持的解析器类型: ${config.type}`);
      }
    } catch (error) {
      console.log(`❌ 解析失败:`, error);
    }
  }
}

// 运行测试
testParsers().catch(console.error);
