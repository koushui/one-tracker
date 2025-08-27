/**
 * 模型厂商推测工具
 * 基于模型名称推测其厂商信息
 */

/**
 * 根据模型名称推测厂商
 * @param modelName 模型名称
 * @returns 厂商名称，如果无法识别则返回 "Unknown"
 */
export function inferModelVendor(modelName: string): string {
  const name = modelName.toLowerCase();

  if (name.includes("gpt") || name.includes("o1") || name.includes("o3")) {
    return "OpenAI";
  } else if (name.includes("claude")) {
    return "Anthropic";
  } else if (name.includes("gemini")) {
    return "Google";
  } else if (name.includes("deepseek")) {
    return "DeepSeek";
  } else if (name.includes("qwen")) {
    return "Qwen";
  } else if (name.includes("llama")) {
    return "Meta";
  } else if (name.includes("mistral")) {
    return "Mistral AI";
  } else if (name.includes("yi-")) {
    return "01.AI";
  } else if (name.includes("moonshot")) {
    return "Moonshot AI";
  } else if (name.includes("glm")) {
    return "Zhipu AI";
  } else if (name.includes("baichuan")) {
    return "Baichuan";
  } else if (name.includes("internlm")) {
    return "InternLM";
  } else if (name.includes("/") && name.split("/").length > 1) {
    return name.split("/")[0];
  }

  return "未知";
}

/**
 * 获取模型的基本信息（仅包含厂商）
 * @param modelName 模型名称
 * @returns 包含厂商信息的对象
 */
export function getModelInfo(modelName: string) {
  return {
    vendor: inferModelVendor(modelName),
  };
}
