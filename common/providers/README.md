# 供应商解析器开发指南

本文档详细说明如何为 one-tracker 项目添加新的供应商解析器。

## 目录结构

```
common/providers/
├── README.md                    # 本文档
├── interfaces.ts               # 解析器接口定义
├── index.ts                    # 解析器统一导出
├── oneapi/                     # OneAPI 解析器
│   ├── index.ts
│   ├── types.ts
│   └── parser.ts
├── onehub/                     # OneHub 解析器
│   ├── index.ts
│   ├── types.ts
│   └── parser.ts
└── newapi/                     # NewAPI 解析器
    ├── index.ts
    ├── types.ts
    └── parser.ts
```

## 解析器类型

系统支持两种类型的解析器：

### 1. 标准解析器 (ProviderParser)

适用于只需要单个 API 请求的供应商。

```typescript
interface ProviderParser<T = unknown> {
  readonly type: string;
  getApiPath(): string;
  canParse(data: unknown): data is T;
  parse(rawData: T): StandardizedPricingRecord;
}
```

### 2. 扩展解析器 (ExtendedProviderParser)

适用于需要多个 API 请求的供应商（如 OneHub 需要获取模型数据和分组数据）。

```typescript
interface ExtendedProviderParser<T = unknown, E = unknown> extends Omit<ProviderParser<T>, "parse"> {
  parse(rawData: T, extraData: E): StandardizedPricingRecord;
  getExtraDataApiPath?(): string;
}
```

## 添加新供应商解析器

### 步骤 1: 创建目录结构

为新供应商创建目录，例如 `newsupplier/`：

```bash
mkdir common/providers/newsupplier
touch common/providers/newsupplier/index.ts
touch common/providers/newsupplier/types.ts
touch common/providers/newsupplier/parser.ts
```

### 步骤 2: 定义数据类型 (`types.ts`)

根据供应商 API 返回的真实数据结构定义类型：

```typescript
/**
 * NewSupplier 原始数据结构
 * 基于真实API返回的数据格式
 */
export interface NewSupplierRawData {
  success: boolean;
  data: {
    [modelName: string]: {
      // 根据实际API结构定义
      price: number;
      type: "tokens" | "times";
      // ... 其他字段
    };
  };
  message?: string;
}
```

**重要提示**: 必须基于真实的 API 数据结构定义类型，不要凭想象或其他供应商的结构。

### 步骤 3: 实现解析器 (`parser.ts`)

#### 标准解析器示例：

```typescript
import { ProviderParser } from "../interfaces";
import { StandardizedPricingRecord, StandardizedModel, StandardizedGroup } from "../../types/pricing";
import { NewSupplierRawData } from "./types";

export class NewSupplierParser implements ProviderParser<NewSupplierRawData> {
  readonly type = "newsupplier";

  constructor(
    private sourceName: string,
    private baseUrl: string,
    private rechargeRatio: number = 1,
  ) {}

  getApiPath(): string {
    return "/api/models"; // 实际的API路径
  }

  private getFullUrl(): string {
    const url = new URL(this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl);
    return url.origin + this.getApiPath();
  }

  canParse(data: unknown): data is NewSupplierRawData {
    if (!data || typeof data !== "object") return false;
    const d = data as any;

    // 根据实际数据结构验证
    return d.success === true && typeof d.data === "object" && d.data !== null;
  }

  parse(rawData: NewSupplierRawData, rateBaseline: number = 0.002): StandardizedPricingRecord {
    if (!this.canParse(rawData)) {
      throw new Error("Invalid NewSupplier data format");
    }

    const models: StandardizedModel[] = [];
    const groups = new Map<string, StandardizedGroup>();

    // 处理模型数据
    for (const [modelName, modelData] of Object.entries(rawData.data)) {
      const model: StandardizedModel = {
        name: modelName,
        type: modelData.type,
        rateBaseline: rateBaseline, // 使用供应商配置的基准价格
        modelRate: modelData.price, // API返回的价格作为模型倍率
        completeRate: 1, // 根据实际情况计算
        perPrice: modelData.type === "times" ? modelData.price : 1,
        supportGroups: ["default"],
      };
      models.push(model);
    }

    // 添加默认分组
    groups.set("default", {
      id: "default",
      name: "默认分组",
      rate: 1,
    });

    return {
      source: {
        name: this.sourceName,
        url: this.getFullUrl(),
        type: this.type,
        rechargeRatio: this.rechargeRatio,
      },
      preference: {
        currency: "CNY",
      },
      models,
      groups: Array.from(groups.values()),
    };
  }
}
```

#### 扩展解析器示例（需要多个API请求）：

```typescript
import { ExtendedProviderParser } from "../interfaces";
import { StandardizedPricingRecord, StandardizedModel, StandardizedGroup } from "../../types/pricing";
import { NewSupplierRawData, NewSupplierExtraData } from "./types";

export class NewSupplierParser implements ExtendedProviderParser<NewSupplierRawData, NewSupplierExtraData> {
  readonly type = "newsupplier";

  constructor(
    private sourceName: string,
    private baseUrl: string,
    private rechargeRatio: number = 1,
  ) {}

  getApiPath(): string {
    return "/api/models";
  }

  getExtraDataApiPath(): string {
    return "/api/groups"; // 额外数据的API路径
  }

  canParse(data: unknown): data is NewSupplierRawData {
    // 验证逻辑
  }

  parse(
    rawData: NewSupplierRawData,
    extraData: NewSupplierExtraData,
    rateBaseline: number = 0.002,
  ): StandardizedPricingRecord {
    if (!this.canParse(rawData)) {
      throw new Error("Invalid NewSupplier data format");
    }

    if (!extraData) {
      throw new Error(
        "NewSupplier requires extra data - call getExtraDataApiPath() to get the additional API endpoint",
      );
    }

    // 解析逻辑，使用两个数据源和供应商基准价格
    // rateBaseline: 供应商配置的基础价格基准
    // modelRate: 从API获取的模型倍率
    // ...
  }
}
```

### 步骤 4: 创建导出文件 (`index.ts`)

```typescript
export { NewSupplierParser } from "./parser";
export type { NewSupplierRawData } from "./types";
```

### 步骤 5: 更新主导出文件

在 `common/providers/index.ts` 中添加新的解析器：

```typescript
export * from "./newsupplier";
```

## 标准化数据结构

所有解析器必须输出符合 `StandardizedPricingRecord` 格式的数据：

```typescript
interface StandardizedPricingRecord {
  source: StandardizedSource; // 源站信息
  preference: UserPreference; // 用户偏好设置
  models: StandardizedModel[]; // 模型列表
  groups: StandardizedGroup[]; // 分组列表
}
```

### 关键字段说明

#### StandardizedModel

- `name`: 模型名称
- `type`: 计费类型 ("tokens" | "times")
- `rateBaseline`: **供应商级别的基础价格基准**，默认0.002，用户可在UI中配置
- `modelRate`: **从API获取的模型倍率**，这是API返回的实际价格或倍率数据
- `completeRate`: 补全倍率（输出/输入价格比例，按次计费时为1）
- `perPrice`: 按次计费时每次调用的价格，token计费时为1
- `supportGroups`: 模型支持的用户组ID列表

#### 重要：价格计算公式

最终价格 = `rateBaseline * modelRate * groupRate * rechargeRatio`

- `rateBaseline`: 供应商基础价格基准（用户配置）
- `modelRate`: API返回的模型价格倍率
- `groupRate`: 分组倍率
- `rechargeRatio`: 充值比例

#### StandardizedGroup

- `id`: 分组唯一标识符
- `name`: 分组显示名称
- `rate`: 分组使用倍率

## 开发最佳实践

### 1. 数据结构设计

- **基于真实API**: 必须基于真实的API返回数据设计类型，不要臆测
- **完整性验证**: 在 `canParse` 方法中严格验证数据结构
- **错误处理**: 提供清晰的错误信息，说明数据格式问题

### 2. 价格计算

**重要：不要混淆 rateBaseline 和 modelRate**

- `rateBaseline`: 始终使用传入的参数（供应商基准价格），默认0.002
- `modelRate`: 使用API返回的实际价格或倍率数据
- **Token计费**: `modelRate = 输入价格`, `completeRate = 输出价格/输入价格`
- **按次计费**: `modelRate = 实际价格`, `completeRate = 1`, `perPrice = 实际价格`

### 3. 分组处理

- **单API供应商**: 创建默认分组，倍率为1
- **多API供应商**: 使用真实的分组数据和倍率
- **缺失分组**: 抛出明确的错误，不要使用默认值

### 4. URL处理

```typescript
private getFullUrl(): string {
  const url = new URL(this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl);
  return url.origin + this.getApiPath();
}
```

## 测试

为新的解析器创建测试用例：

```typescript
// examples/newsupplier_example.ts
import { NewSupplierParser } from "../common/providers/newsupplier";

async function testNewSupplierParser() {
  const parser = new NewSupplierParser("测试源站", "https://api.example.com", 1);

  // 使用真实的API数据进行测试
  const mockData = {
    // 从实际API获取的数据
  };

  console.log("canParse:", parser.canParse(mockData));

  try {
    const result = parser.parse(mockData);
    console.log("解析成功:", result);
  } catch (error) {
    console.error("解析失败:", error);
  }
}
```

## 常见问题

### Q: 如何处理跨域问题？

A: 前端不应该直接调用供应商API。所有API请求都应该通过后端代理，解析器在后端使用。

### Q: 供应商API格式变更怎么办？

A: 更新对应的 `types.ts` 和解析逻辑。类型定义应该始终反映真实的API结构。

### Q: 如何处理不同的计费方式？

A: 在解析时根据 `type` 字段正确设置 `rateBaseline`、`completeRate` 和 `perPrice`。

### Q: 是否需要兼容旧版本API？

A: 不需要。每个解析器专门处理一种特定的API格式，保持代码简洁。

## 现有解析器参考

- **OneAPI**: 标准解析器，处理复杂的分组定价结构
- **OneHub**: 扩展解析器，需要额外获取分组映射数据
- **NewAPI**: 标准解析器，简单的模型定价结构

查看这些解析器的实现可以作为开发新解析器的参考。
