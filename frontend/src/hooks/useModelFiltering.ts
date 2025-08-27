import { useMemo, useState, useCallback } from "react";
import { ModelComparison } from "../components/pricing/ModelComparisonCard";
import { ViewOptions } from "../components/pricing/UnifiedFilterPanel";
import { FavoriteModels, HiddenModels } from "./useModelPreferences";

export const useModelFiltering = (
  modelComparisons: ModelComparison[],
  viewOptions: ViewOptions,
  favoriteModels: FavoriteModels,
  hiddenModels: HiddenModels,
) => {
  const [searchQuery, setSearchQuery] = useState("");

  // 搜索和过滤逻辑
  const filteredModels = useMemo(() => {
    let filtered = modelComparisons.filter((model) => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = model.modelName.toLowerCase().includes(query);
        const matchesVendor = model.vendor.toLowerCase().includes(query);
        const matchesTags = model.tags.some((tag) => tag.toLowerCase().includes(query));

        if (!matchesName && !matchesVendor && !matchesTags) {
          return false;
        }
      }

      // 只显示收藏的模型
      if (viewOptions.onlyFavorites && !favoriteModels[model.modelName]) {
        return false;
      }

      // 隐藏已隐藏的模型
      if (viewOptions.hideHiddenModels && hiddenModels[model.modelName]) {
        return false;
      }

      // 按厂商过滤
      if (viewOptions.filterVendor && viewOptions.filterVendor !== model.vendor) {
        return false;
      }

      // 按供应商数量过滤
      const providerCount = model.providers.length;
      switch (viewOptions.providerCountFilter) {
        case "all":
          // 不过滤
          break;
        case "single":
          if (providerCount !== 1) return false;
          break;
        case "multiple":
          if (providerCount <= 1) return false;
          break;
        default:
          // 具体数字
          if (typeof viewOptions.providerCountFilter === "number") {
            if (viewOptions.providerCountFilter === 11) {
              // 11个或更多（当maxProviderCount > 10时）
              if (providerCount < 11) return false;
            } else {
              // 恰好指定数量
              if (providerCount !== viewOptions.providerCountFilter) return false;
            }
          }
          break;
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (viewOptions.sortBy) {
        case "price":
          const [inputRatio, outputRatio] = viewOptions.inputOutputRatio;
          const totalRatio = inputRatio + outputRatio;

          const aPrice =
            a.providers.length > 0
              ? a.modelType === "tokens"
                ? (a.providers[0].inputPrice * inputRatio + a.providers[0].outputPrice * outputRatio) / totalRatio
                : a.providers[0].perCallPrice || 0
              : 0;
          const bPrice =
            b.providers.length > 0
              ? b.modelType === "tokens"
                ? (b.providers[0].inputPrice * inputRatio + b.providers[0].outputPrice * outputRatio) / totalRatio
                : b.providers[0].perCallPrice || 0
              : 0;
          comparison = aPrice - bPrice;
          break;
        case "name":
          comparison = a.modelName.localeCompare(b.modelName);
          break;
        case "vendor":
          comparison = a.vendor.localeCompare(b.vendor);
          break;
        case "difference":
          comparison = a.priceDifference - b.priceDifference;
          break;
        case "providerCount":
          comparison = a.providers.length - b.providers.length;
          break;
      }

      // 如果主排序相等，使用模型名称作为次级排序（保持稳定排序）
      if (comparison === 0) {
        comparison = a.modelName.localeCompare(b.modelName);
      }

      return viewOptions.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [modelComparisons, viewOptions, favoriteModels, hiddenModels, searchQuery]);

  // 获取过滤后的模型名称列表（用于批量操作）
  const getFilteredModelNames = useCallback(() => {
    return filteredModels.map((model) => model.modelName);
  }, [filteredModels]);

  // 清空搜索
  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    filteredModels,
    searchQuery,
    setSearchQuery,
    clearSearch,
    getFilteredModelNames,
  };
};

export default useModelFiltering;
