import { useState, useCallback, useEffect, useRef } from "react";

export interface ProviderSelection {
  [modelName: string]: string; // 模型名 -> 选中的供应商名
}

const STORAGE_KEY = "one-tracker-provider-selection";

/**
 * 供应商选择状态管理Hook
 * 支持持久化存储，为未来的自动定价和历史比价功能做数据基础
 */
export const useProviderSelection = () => {
  const [selectedProviders, setSelectedProviders] = useState<ProviderSelection>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // 从localStorage加载选择状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedProviders(parsed);
      }
    } catch (error) {
      console.warn("Failed to load provider selection from localStorage:", error);
    }
  }, []);

  // 保存选择状态到localStorage（防抖）
  const saveToStorage = useCallback((selection: ProviderSelection) => {
    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 设置防抖保存
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
      } catch (error) {
        console.warn("Failed to save provider selection to localStorage:", error);
      }
    }, 300); // 300ms 防抖
  }, []);

  // 选择特定模型的供应商
  const selectProvider = useCallback(
    (modelName: string, providerName: string) => {
      setSelectedProviders((prev) => {
        const newSelection = { ...prev, [modelName]: providerName };
        saveToStorage(newSelection);
        return newSelection;
      });
    },
    [saveToStorage],
  );

  // 获取特定模型的选中供应商
  const getSelectedProvider = useCallback(
    (modelName: string): string | undefined => {
      return selectedProviders[modelName];
    },
    [selectedProviders],
  );

  // 获取特定模型的选中供应商（包含默认选择）
  const getSelectedProviderWithDefault = useCallback(
    (modelName: string, defaultProvider?: string): string | undefined => {
      return selectedProviders[modelName] || defaultProvider;
    },
    [selectedProviders],
  );

  // 批量选择最低价供应商
  const selectLowestPriceProviders = useCallback(
    (
      modelComparisons: Array<{
        modelName: string;
        providers: Array<{ providerName: string; isLowestPrice: boolean }>;
      }>,
    ) => {
      const newSelection = { ...selectedProviders };

      modelComparisons.forEach((model) => {
        const lowestProvider = model.providers.find((p) => p.isLowestPrice);
        if (lowestProvider) {
          newSelection[model.modelName] = lowestProvider.providerName;
        }
      });

      setSelectedProviders(newSelection);
      saveToStorage(newSelection);
    },
    [selectedProviders, saveToStorage],
  );

  // 清除所有选择
  const clearAllSelections = useCallback(() => {
    setSelectedProviders({});
    saveToStorage({});
  }, [saveToStorage]);

  // 清除特定模型的选择
  const clearModelSelection = useCallback(
    (modelName: string) => {
      setSelectedProviders((prev) => {
        const newSelection = { ...prev };
        delete newSelection[modelName];
        saveToStorage(newSelection);
        return newSelection;
      });
    },
    [saveToStorage],
  );

  return {
    selectedProviders,
    selectProvider,
    getSelectedProvider,
    getSelectedProviderWithDefault,
    selectLowestPriceProviders,
    clearAllSelections,
    clearModelSelection,
  };
};
