import { BaseParser, ProviderParserFactory } from "./interfaces";
import { OneAPIParser } from "./oneapi/parser";
import { OneHubParser } from "./onehub/parser";
import { NewAPIParser } from "./newapi/parser";

/**
 * 供应商解析器工厂
 * 实现依赖倒置原则，支持动态注册解析器
 */
export class ProviderFactory implements ProviderParserFactory {
  private parsers = new Map<string, new (name: string, url: string, ratio: number) => BaseParser>();

  constructor() {
    // 注册默认解析器
    this.registerParser("oneapi", OneAPIParser);
    this.registerParser("onehub", OneHubParser);
    this.registerParser("newapi", NewAPIParser);
  }

  registerParser<T>(type: string, parserClass: new (name: string, url: string, ratio: number) => BaseParser): void {
    this.parsers.set(type.toLowerCase(), parserClass);
  }

  createParser(type: string, sourceName: string, sourceUrl: string, rechargeRatio: number = 1): BaseParser | null {
    const ParserClass = this.parsers.get(type.toLowerCase());
    if (!ParserClass) return null;

    return new ParserClass(sourceName, sourceUrl, rechargeRatio);
  }

  getSupportedTypes(): string[] {
    return Array.from(this.parsers.keys());
  }

  isSupported(type: string): boolean {
    return this.parsers.has(type.toLowerCase());
  }
}
