import { useState, useCallback, useEffect, useRef } from "react";

export interface GroupSelection {
  [modelName: string]: {
    [providerName: string]: string; // 选中的分组ID
  };
}

const STORAGE_KEY = "one-tracker-group-selection";

/**
 * 分组选择状态管理Hook
 * 管理每个模型在每个供应商下的分组选择
 */
export const useGroupSelection = () => {
  const [selectedGroups, setSelectedGroups] = useState<GroupSelection>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // 从localStorage加载选择状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedGroups(parsed);
      }
    } catch (error) {
      console.warn("Failed to load group selection from localStorage:", error);
    }
  }, []);

  // 保存选择状态到localStorage（防抖）
  const saveToStorage = useCallback((selection: GroupSelection) => {
    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 设置防抖保存
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
      } catch (error) {
        console.warn("Failed to save group selection to localStorage:", error);
      }
    }, 300); // 300ms 防抖
  }, []);

  // 选择特定模型特定供应商的分组
  const selectGroup = useCallback(
    (modelName: string, providerName: string, groupId: string) => {
      setSelectedGroups((prev) => {
        const newSelection = {
          ...prev,
          [modelName]: {
            ...prev[modelName],
            [providerName]: groupId,
          },
        };
        saveToStorage(newSelection);
        return newSelection;
      });
    },
    [saveToStorage],
  );

  // 取消选择特定模型特定供应商的分组
  const clearGroupSelection = useCallback(
    (modelName: string, providerName: string) => {
      setSelectedGroups((prev) => {
        const newSelection = { ...prev };
        if (newSelection[modelName]) {
          delete newSelection[modelName][providerName];
          if (Object.keys(newSelection[modelName]).length === 0) {
            delete newSelection[modelName];
          }
        }
        saveToStorage(newSelection);
        return newSelection;
      });
    },
    [saveToStorage],
  );

  // 获取特定模型特定供应商的选中分组
  const getSelectedGroup = useCallback(
    (modelName: string, providerName: string): string | undefined => {
      return selectedGroups[modelName]?.[providerName];
    },
    [selectedGroups],
  );

  // 获取特定模型特定供应商的有效分组（包含默认选择）
  const getEffectiveGroup = useCallback(
    (
      modelName: string,
      providerName: string,
      availableGroups: Array<{ id: string; rate: number }>,
    ): string | undefined => {
      // 如果有手动选择，使用手动选择
      const manualSelection = selectedGroups[modelName]?.[providerName];
      if (manualSelection) {
        return manualSelection;
      }

      // 否则选择倍率最低的分组作为默认
      if (availableGroups.length > 0) {
        const lowestRateGroup = availableGroups.reduce((lowest, current) =>
          current.rate < lowest.rate ? current : lowest,
        );
        return lowestRateGroup.id;
      }

      return undefined;
    },
    [selectedGroups],
  );

  // 切换分组选择（选中则取消，未选中则选中）
  const toggleGroupSelection = useCallback(
    (modelName: string, providerName: string, groupId: string) => {
      const currentSelection = getSelectedGroup(modelName, providerName);
      if (currentSelection === groupId) {
        clearGroupSelection(modelName, providerName);
      } else {
        selectGroup(modelName, providerName, groupId);
      }
    },
    [getSelectedGroup, clearGroupSelection, selectGroup],
  );

  // 清除所有分组选择
  const clearAllGroupSelections = useCallback(() => {
    setSelectedGroups({});
    saveToStorage({});
  }, [saveToStorage]);

  return {
    selectedGroups,
    selectGroup,
    clearGroupSelection,
    getSelectedGroup,
    getEffectiveGroup,
    toggleGroupSelection,
    clearAllGroupSelections,
  };
};
