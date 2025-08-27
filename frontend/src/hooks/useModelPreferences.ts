import { useState, useCallback } from "react";

// 收藏的模型
export interface FavoriteModels {
  [modelName: string]: boolean;
}

// 隐藏的模型
export interface HiddenModels {
  [modelName: string]: boolean;
}

export const useModelPreferences = () => {
  const [favoriteModels, setFavoriteModels] = useState<FavoriteModels>({});
  const [hiddenModels, setHiddenModels] = useState<HiddenModels>({});

  // 切换模型收藏状态
  const toggleFavorite = useCallback((modelName: string) => {
    setFavoriteModels((prev) => ({
      ...prev,
      [modelName]: !prev[modelName],
    }));
  }, []);

  // 切换模型隐藏状态
  const toggleHidden = useCallback((modelName: string) => {
    setHiddenModels((prev) => ({
      ...prev,
      [modelName]: !prev[modelName],
    }));
  }, []);

  // 批量收藏模型
  const batchFavorite = useCallback((modelNames: string[]) => {
    setFavoriteModels((prev) => {
      const updated = { ...prev };
      modelNames.forEach((name) => {
        updated[name] = true;
      });
      return updated;
    });
  }, []);

  // 批量隐藏模型
  const batchHide = useCallback((modelNames: string[]) => {
    setHiddenModels((prev) => {
      const updated = { ...prev };
      modelNames.forEach((name) => {
        updated[name] = true;
      });
      return updated;
    });
  }, []);

  // 批量取消收藏
  const batchUnfavorite = useCallback((modelNames: string[]) => {
    setFavoriteModels((prev) => {
      const updated = { ...prev };
      modelNames.forEach((name) => {
        delete updated[name];
      });
      return updated;
    });
  }, []);

  // 批量显示模型
  const batchShow = useCallback((modelNames: string[]) => {
    setHiddenModels((prev) => {
      const updated = { ...prev };
      modelNames.forEach((name) => {
        delete updated[name];
      });
      return updated;
    });
  }, []);

  // 清空所有收藏
  const clearAllFavorites = useCallback(() => {
    setFavoriteModels({});
  }, []);

  // 清空所有隐藏
  const clearAllHidden = useCallback(() => {
    setHiddenModels({});
  }, []);

  // 获取收藏的模型列表
  const getFavoriteModelNames = useCallback(() => {
    return Object.keys(favoriteModels).filter((name) => favoriteModels[name]);
  }, [favoriteModels]);

  // 获取隐藏的模型列表
  const getHiddenModelNames = useCallback(() => {
    return Object.keys(hiddenModels).filter((name) => hiddenModels[name]);
  }, [hiddenModels]);

  return {
    favoriteModels,
    hiddenModels,
    toggleFavorite,
    toggleHidden,
    batchFavorite,
    batchHide,
    batchUnfavorite,
    batchShow,
    clearAllFavorites,
    clearAllHidden,
    getFavoriteModelNames,
    getHiddenModelNames,
  };
};

export default useModelPreferences;
