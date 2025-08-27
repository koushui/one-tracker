import React, { useState, useMemo, useCallback } from "react";
import {
  Container,
  Typography,
  Alert,
  Grid,
  Box,
  Paper,
  Stack,
  Divider,
  Skeleton,
  Fade,
  LinearProgress,
  CircularProgress,
  Pagination,
} from "@mui/material";
import { AttachMoney as MoneyIcon, Info as InfoIcon } from "@mui/icons-material";
import {
  PricingDataService,
  PricingSourceConfig,
  StandardizedPricingRecord,
  PricingCalculator,
  CalculatedPrice as CalcPrice,
  getModelInfo,
  generateProviderColor,
} from "../../../common";
import {
  ProviderConfigPanel,
  UnifiedFilterPanel,
  ModelComparisonCard,
  ProviderOverview,
  type ProviderConfig,
  type ViewOptions,
  type ModelComparison,
  type GroupState,
} from "../components/pricing";
import { useModelPreferences, useModelFiltering, useProviderSelection, useGroupSelection } from "../hooks";

const PricingComparePage: React.FC = () => {
  const [enabledGroups, setEnabledGroups] = useState<GroupState[]>([]);
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    inputOutputRatio: [7, 3],
    showKTokens: false,
    currency: "CNY",
    sortBy: "name",
    sortOrder: "asc",
    filterVendor: "",
    onlyFavorites: false,
    hideHiddenModels: true,
    providerCountFilter: "all",
  });

  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [pricingData, setPricingData] = useState<StandardizedPricingRecord[]>([]);
  const [calculatedPrices, setCalculatedPrices] = useState<CalcPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessingModels, setIsProcessingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const modelsPerPage = 100;
  const [pricingService] = useState(() => new PricingDataService());
  const [isConfigLocked, setIsConfigLocked] = useState(false);

  // 使用自定义hooks
  const { favoriteModels, hiddenModels, toggleFavorite, toggleHidden, batchFavorite, batchHide } =
    useModelPreferences();

  const { selectedProviders, selectProvider, getSelectedProvider, selectLowestPriceProviders, clearAllSelections } =
    useProviderSelection();

  const { getSelectedGroup, getEffectiveGroup, toggleGroupSelection, clearAllGroupSelections } = useGroupSelection();

  // 添加新供应商
  const addProvider = useCallback(() => {
    const newProvider: ProviderConfig = {
      id: Date.now().toString(),
      name: "",
      url: "",
      type: "onehub",
      rechargeRatio: 1,
      rateBaseline: 0.002,
      modelFilterMode: "none",
      modelFilters: [],
    };
    setProviders((prev) => [...prev, newProvider]);
  }, []);

  // 删除供应商
  const removeProvider = useCallback((id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // 更新供应商配置
  const updateProvider = useCallback((id: string, field: keyof ProviderConfig, value: any) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }, []);

  // 验证配置
  const validateConfig = (config: PricingSourceConfig): string[] => {
    const errors: string[] = [];

    if (!config.name.trim()) {
      errors.push("供应商名称不能为空");
    }

    if (!config.url.trim()) {
      errors.push("API地址不能为空");
    } else {
      try {
        new URL(config.url);
      } catch {
        errors.push("API地址格式不正确");
      }
    }

    if (config.rechargeRatio <= 0) {
      errors.push("充值比例必须大于0");
    }

    if (!pricingService.isSupported(config.type)) {
      errors.push(`不支持的解析器类型: ${config.type}`);
    }

    return errors;
  };

  // 初始化分组状态
  const initializeGroups = useCallback((data: StandardizedPricingRecord[]) => {
    const groups = PricingCalculator.initializeGroupStates(data);
    setEnabledGroups(groups);
  }, []);

  // 切换分组启用状态
  const toggleGroup = useCallback((groupId: string) => {
    setEnabledGroups((prev) =>
      prev.map((group) => (group.groupId === groupId ? { ...group, enabled: !group.enabled } : group)),
    );
  }, []);

  // 当拉取到新数据时初始化分组
  const fetchPricingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const validConfigs: PricingSourceConfig[] = [];
      const errors: string[] = [];

      providers.forEach((provider, index) => {
        const config: PricingSourceConfig = {
          name: provider.name,
          url: provider.url,
          type: provider.type,
          rechargeRatio: provider.rechargeRatio,
          rateBaseline: provider.rateBaseline || 0.002,
        };

        const validationErrors = validateConfig(config);
        if (validationErrors.length > 0) {
          errors.push(`供应商 ${index + 1}: ${validationErrors.join(", ")}`);
        } else {
          validConfigs.push(config);
        }
      });

      if (errors.length > 0) {
        throw new Error(errors.join("\n"));
      }

      if (validConfigs.length === 0) {
        throw new Error("没有有效的供应商配置");
      }

      const results = await pricingService.fetchMultipleSources(validConfigs);

      // 应用模型过滤
      const filteredResults = results.map((providerResult) => {
        const provider = providers.find((p) => p.name === providerResult.source.name);
        if (!provider || provider.modelFilterMode === "none") {
          return providerResult;
        }

        const filteredModels = providerResult.models.filter((model) => {
          const modelName = model.name.toLowerCase();
          const filters = provider.modelFilters || [];

          if (provider.modelFilterMode === "whitelist") {
            // 白名单：模型名包含任一关键词才保留
            return (
              filters.length === 0 ||
              filters.some((filter) => filter.trim() && modelName.includes(filter.trim().toLowerCase()))
            );
          } else if (provider.modelFilterMode === "blacklist") {
            // 黑名单：模型名不包含任何关键词才保留
            return (
              filters.length === 0 ||
              !filters.some((filter) => filter.trim() && modelName.includes(filter.trim().toLowerCase()))
            );
          }

          return true;
        });

        return {
          ...providerResult,
          models: filteredModels,
        };
      });

      setPricingData(filteredResults);

      // 初始化分组状态
      initializeGroups(filteredResults);

      // 开始处理模型数据
      setIsProcessingModels(true);

      // 拉取成功后锁定配置
      setIsConfigLocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取价格数据失败");
      setIsProcessingModels(false);
    } finally {
      setLoading(false);
    }
  };

  // 当分组状态变化时重新计算价格
  React.useEffect(() => {
    if (pricingData.length > 0 && enabledGroups.length > 0) {
      const prices = PricingCalculator.calculateCrossSitePrices(pricingData, enabledGroups);
      setCalculatedPrices(prices);
    }
  }, [enabledGroups, pricingData]);

  // 优化：预计算分组查找映射，避免重复查找
  const groupLookupMap = useMemo(() => {
    const map = new Map<string, { rate: number }>();
    enabledGroups.forEach((group) => {
      const originalGroupId = group.groupId.replace(`${group.providerName}-`, "");
      const key = `${group.providerName}-${originalGroupId}`;
      map.set(key, { rate: group.rate });
    });
    return map;
  }, [enabledGroups]);

  // 优化：预计算供应商数据映射，避免重复查找
  const providerDataMap = useMemo(() => {
    const map = new Map<string, any>();
    pricingData.forEach((provider) => {
      map.set(provider.source.name, provider);
    });
    return map;
  }, [pricingData]);

  // 生成模型比价数据
  const modelComparisons = useMemo((): ModelComparison[] => {
    if (calculatedPrices.length === 0) return [];

    const modelMap = new Map<string, ModelComparison>();

    calculatedPrices.forEach((price) => {
      if (!modelMap.has(price.modelName)) {
        // 获取模型的基本信息
        const modelInfo = getModelInfo(price.modelName);

        modelMap.set(price.modelName, {
          modelName: price.modelName,
          modelType: price.type,
          providers: [],
          lowestProvider: "",
          highestProvider: "",
          priceDifference: 0,
          tags: [], // 不再推测标签
          vendor: modelInfo.vendor,
        });
      }

      const model = modelMap.get(price.modelName)!;

      // 优化：使用预计算的映射快速查找可用分组
      const providerData = providerDataMap.get(price.providerName);
      const modelData = providerData?.models.find((m: any) => m.name === price.modelName);
      const availableGroups = modelData
        ? enabledGroups
            .filter((g) => {
              // enabledGroups中的groupId格式是 "供应商名-分组ID"，需要提取出原始分组ID进行比较
              const originalGroupId = g.groupId.replace(`${g.providerName}-`, "");
              return (
                g.enabled && g.providerName === price.providerName && modelData.supportGroups.includes(originalGroupId)
              );
            })
            .map((g) => ({
              id: g.groupId.replace(`${g.providerName}-`, ""), // 使用原始分组ID
              rate: g.rate,
            }))
        : [];

      // 如果该供应商没有可用的分组，跳过这个供应商
      if (availableGroups.length === 0) {
        return;
      }

      // 获取有效分组ID（手动选择或默认最低倍率）
      const effectiveGroupId = getEffectiveGroup(price.modelName, price.providerName, availableGroups);

      // 使用通用组件的动态价格计算逻辑
      let adjustedInputPrice = price.pricePer1KInput;
      let adjustedOutputPrice = price.pricePer1KOutput;
      let adjustedCallPrice = price.perCallPrice || 0;

      if (effectiveGroupId) {
        const groupKey = `${price.providerName}-${effectiveGroupId}`;
        const selectedGroup = groupLookupMap.get(groupKey);

        if (selectedGroup) {
          // 使用通用组件的动态价格计算
          const dynamicPrice = PricingCalculator.calculateDynamicPrice(
            {
              name: price.modelName,
              type: price.type,
              rateBaseline: price.originalModelParams.rateBaseline,
              modelRate: price.originalModelParams.modelRate,
              completeRate: price.originalModelParams.completeRate,
              perPrice: price.originalModelParams.perPrice || 1,
              supportGroups: [], // 不需要用到
            },
            price.source,
            selectedGroup.rate,
          );

          adjustedInputPrice = dynamicPrice.inputPrice;
          adjustedOutputPrice = dynamicPrice.outputPrice;
          adjustedCallPrice = dynamicPrice.perCallPrice;
        }
      }

      // 计算基于用户设置的加权价格
      const [inputRatio, outputRatio] = viewOptions.inputOutputRatio;
      const totalRatio = inputRatio + outputRatio;
      const weightedPrice =
        price.type === "tokens"
          ? (adjustedInputPrice * inputRatio + adjustedOutputPrice * outputRatio) / totalRatio
          : adjustedCallPrice;

      // 构建完整的可用分组信息（用于UI显示）
      const fullAvailableGroups = availableGroups.map((g) => {
        const fullGroupInfo = enabledGroups.find(
          (eg) => eg.providerName === price.providerName && eg.groupId.replace(`${eg.providerName}-`, "") === g.id,
        );
        return {
          id: g.id,
          name: fullGroupInfo?.groupName || g.id,
          rate: g.rate,
        };
      });

      // 找到最优分组（倍率最低）
      const bestGroup = fullAvailableGroups.reduce(
        (best, current) => (current.rate < best.rate ? current : best),
        fullAvailableGroups[0] || { id: "default", name: "默认", rate: 1 },
      );

      model.providers.push({
        providerName: price.providerName,
        providerUrl: price.source.url,
        inputPrice: adjustedInputPrice, // 每1K tokens的输入价格（分）- 已应用分组倍率
        outputPrice: adjustedOutputPrice, // 每1K tokens的输出价格（分）- 已应用分组倍率
        perCallPrice: adjustedCallPrice,
        availableGroups: fullAvailableGroups,
        bestGroup,
        isLowestPrice: false, // 稍后计算
        priceRank: 0, // 稍后计算
        // 添加原始模型参数
        originalModelParams: {
          rateBaseline: price.originalModelParams.rateBaseline,
          modelRate: price.originalModelParams.modelRate,
          completeRate: price.originalModelParams.completeRate,
          perPrice: price.originalModelParams.perPrice,
          rechargeRatio: price.source.rechargeRatio,
        },
      });
    });

    // 计算每个模型的价格排名和最优供应商
    modelMap.forEach((model) => {
      if (model.providers.length === 0) return;

      // 按加权价格排序
      const [inputRatio, outputRatio] = viewOptions.inputOutputRatio;
      const totalRatio = inputRatio + outputRatio;

      model.providers.sort((a, b) => {
        const aPrice =
          model.modelType === "tokens"
            ? (a.inputPrice * inputRatio + a.outputPrice * outputRatio) / totalRatio
            : a.perCallPrice || 0;
        const bPrice =
          model.modelType === "tokens"
            ? (b.inputPrice * inputRatio + b.outputPrice * outputRatio) / totalRatio
            : b.perCallPrice || 0;
        return aPrice - bPrice;
      });

      // 设置价格排名
      model.providers.forEach((provider, index) => {
        provider.priceRank = index + 1;
        provider.isLowestPrice = index === 0;
      });

      model.lowestProvider = model.providers[0].providerName;
      model.highestProvider = model.providers[model.providers.length - 1].providerName;

      // 计算价格差异百分比
      if (model.providers.length > 1) {
        const lowestPrice =
          model.modelType === "tokens"
            ? (model.providers[0].inputPrice * inputRatio + model.providers[0].outputPrice * outputRatio) / totalRatio
            : model.providers[0].perCallPrice || 0;
        const highestPrice =
          model.modelType === "tokens"
            ? (model.providers[model.providers.length - 1].inputPrice * inputRatio +
                model.providers[model.providers.length - 1].outputPrice * outputRatio) /
              totalRatio
            : model.providers[model.providers.length - 1].perCallPrice || 0;

        model.priceDifference = lowestPrice > 0 ? ((highestPrice - lowestPrice) / lowestPrice) * 100 : 0;
      }
    });

    // 过滤掉没有任何供应商的模型（所有供应商的分组都被禁用）
    return Array.from(modelMap.values()).filter((model) => model.providers.length > 0);
  }, [
    calculatedPrices,
    viewOptions.inputOutputRatio,
    getSelectedGroup,
    groupLookupMap,
    providerDataMap,
    enabledGroups,
  ]);

  // 监听模型比价数据计算完成
  React.useEffect(() => {
    if (isProcessingModels && modelComparisons.length > 0) {
      // 添加一个小延迟以确保UI有足够的反馈时间
      const timer = setTimeout(() => {
        setIsProcessingModels(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isProcessingModels, modelComparisons.length]);

  // 更新视图选项
  const updateViewOptions = useCallback((updates: Partial<ViewOptions>) => {
    setViewOptions((prev) => ({ ...prev, ...updates }));
  }, []);

  // 使用过滤Hook
  const {
    filteredModels: filteredAndSortedModels,
    searchQuery,
    setSearchQuery,
    clearSearch,
    getFilteredModelNames,
  } = useModelFiltering(modelComparisons, viewOptions, favoriteModels, hiddenModels);

  // 获取可用的厂商列表
  const availableVendors = useMemo(() => {
    const vendors = new Set(modelComparisons.map((m) => m.vendor));
    return Array.from(vendors).sort();
  }, [modelComparisons]);

  // 获取当前数据中模型的最大供应商数量
  const maxProviderCount = useMemo(() => {
    if (modelComparisons.length === 0) return 0;
    return Math.max(...modelComparisons.map((model) => model.providers.length));
  }, [modelComparisons]);

  // 批量操作处理函数
  const handleBatchFavorite = useCallback(() => {
    const modelNames = getFilteredModelNames();
    batchFavorite(modelNames);
  }, [getFilteredModelNames, batchFavorite]);

  const handleBatchHide = useCallback(() => {
    const modelNames = getFilteredModelNames();
    batchHide(modelNames);
  }, [getFilteredModelNames, batchHide]);

  const handleBatchSelectLowestPrice = useCallback(() => {
    selectLowestPriceProviders(filteredAndSortedModels);
  }, [selectLowestPriceProviders, filteredAndSortedModels]);

  // 综合重置函数：清除所有选择（供应商选择 + 分组选择）
  const handleClearAllSelections = useCallback(() => {
    clearAllSelections();
    clearAllGroupSelections();
  }, [clearAllSelections, clearAllGroupSelections]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredAndSortedModels.length / modelsPerPage);
  const paginatedModels = useMemo(() => {
    const startIndex = (currentPage - 1) * modelsPerPage;
    const endIndex = startIndex + modelsPerPage;
    return filteredAndSortedModels.slice(startIndex, endIndex);
  }, [filteredAndSortedModels, currentPage, modelsPerPage]);

  // 当筛选条件变化时重置到第一页
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredAndSortedModels.length]);

  // 分页控制函数
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // 重新配置供应商（清除数据并解锁）
  const resetAndUnlock = useCallback(() => {
    setIsConfigLocked(false);
    setPricingData([]);
    setCalculatedPrices([]);
    setEnabledGroups([]);
    setError(null);
    // 清除所有模型的选择供应商和分组
    clearAllSelections();
    clearAllGroupSelections();
  }, [clearAllSelections, clearAllGroupSelections]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 简化的页面标题 */}
      <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
        <MoneyIcon sx={{ mr: 1.5, fontSize: "2rem", color: "primary.main" }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          统一大模型价格比价器
        </Typography>
      </Stack>

      {/* 供应商配置面板 */}
      <ProviderConfigPanel
        providers={providers}
        onUpdateProvider={updateProvider}
        onAddProvider={addProvider}
        onRemoveProvider={removeProvider}
        onFetchPricing={fetchPricingData}
        loading={loading}
        pricingService={pricingService}
        isLocked={isConfigLocked}
        onToggleLock={resetAndUnlock}
      />

      {/* 供应商概览 */}
      {modelComparisons.length > 0 && (
        <ProviderOverview
          providers={providers}
          modelComparisons={modelComparisons}
          enabledGroups={enabledGroups}
          viewOptions={viewOptions}
          isAnonymousMode={isAnonymousMode}
          onToggleGroup={toggleGroup}
          onUpdateViewOptions={updateViewOptions}
          onToggleAnonymousMode={setIsAnonymousMode}
        />
      )}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 统一的过滤控制面板 */}
      {modelComparisons.length > 0 && (
        <>
          <UnifiedFilterPanel
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filteredCount={filteredAndSortedModels.length}
            totalCount={modelComparisons.length}
            onClearSearch={clearSearch}
            onBatchFavorite={handleBatchFavorite}
            onBatchHide={handleBatchHide}
            onBatchSelectLowestPrice={handleBatchSelectLowestPrice}
            onClearAllSelections={handleClearAllSelections}
            viewOptions={viewOptions}
            onUpdateViewOptions={updateViewOptions}
            availableVendors={availableVendors}
            maxProviderCount={maxProviderCount}
          />

          {/* 分页信息提示 */}
          {filteredAndSortedModels.length > modelsPerPage && (
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary" textAlign="center">
              <InfoIcon sx={{ fontSize: 16, mr: 1, verticalAlign: "middle" }} />
              当前显示第 {currentPage} 页，每页最多 {modelsPerPage} 个模型。
            </Typography>
          )}
        </>
      )}

      {/* 模型比价视图 */}
      {isProcessingModels ? (
        <Fade in={isProcessingModels}>
          <Box>
            {/* 加载进度条 */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CircularProgress size={20} />
                  <Typography variant="h6">正在处理模型数据...</Typography>
                </Stack>
                <LinearProgress sx={{ borderRadius: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  正在计算 {pricingData.length} 个模型的价格信息，请稍候...
                </Typography>
              </Stack>
            </Paper>

            {/* 骨架屏 */}
            <Grid container spacing={3}>
              {Array.from({ length: Math.min(5, modelsPerPage) }).map((_, index) => (
                <Grid item xs={12} key={`skeleton-${index}`}>
                  <Paper sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item md={3}>
                        <Stack spacing={1}>
                          <Skeleton variant="text" width="60%" height={28} />
                          <Skeleton variant="text" width="40%" height={20} />
                          <Skeleton variant="text" width="80%" height={20} />
                        </Stack>
                      </Grid>
                      <Grid item md={9}>
                        <Grid container spacing={2}>
                          {Array.from({ length: 3 }).map((_, cardIndex) => (
                            <Grid item md={4} key={cardIndex}>
                              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      ) : filteredAndSortedModels.length > 0 ? (
        <Fade in={!isProcessingModels} timeout={500}>
          <Box>
            <Grid container spacing={3}>
              {paginatedModels.map((model) => (
                <Grid item xs={12} key={model.modelName}>
                  <ModelComparisonCard
                    model={model}
                    viewOptions={viewOptions}
                    isFavorite={!!favoriteModels[model.modelName]}
                    isHidden={!!hiddenModels[model.modelName]}
                    selectedProvider={getSelectedProvider(model.modelName)}
                    providerConfigs={providers.map((p) => ({
                      name: p.name,
                      color: p.color || generateProviderColor(p.url).solidColor,
                    }))}
                    isAnonymousMode={isAnonymousMode}
                    onToggleFavorite={toggleFavorite}
                    onToggleHidden={toggleHidden}
                    onSelectProvider={selectProvider}
                    onToggleGroupSelection={toggleGroupSelection}
                    getSelectedGroup={getSelectedGroup}
                  />
                </Grid>
              ))}
            </Grid>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, page) => handlePageChange(page)}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    siblingCount={1}
                    boundaryCount={1}
                  />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      显示第 {(currentPage - 1) * modelsPerPage + 1} -{" "}
                      {Math.min(currentPage * modelsPerPage, filteredAndSortedModels.length)} 项，共{" "}
                      {filteredAndSortedModels.length} 个模型
                    </Typography>
                    {totalPages > 10 && (
                      <Typography variant="body2" color="text.secondary">
                        • 共 {totalPages} 页
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </Box>
            )}
          </Box>
        </Fade>
      ) : modelComparisons.length > 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            没有找到匹配的模型
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请调整过滤条件或搜索关键词
          </Typography>
        </Box>
      ) : null}

      {/* 简化的使用说明 - 仅在有数据时显示 */}
      {modelComparisons.length > 0 && (
        <Paper sx={{ p: 2.5, mt: 3, bgcolor: "surfaces.subtle" }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <InfoIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              使用提示
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                💡 <strong>使用场景权重</strong>：调整输入输出比例以匹配您的实际使用场景
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                🎯 <strong>智能比较</strong>：智能综合计算最优供应商
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                📊 <strong>透明计算</strong>：鼠标悬浮价格可查看详细的计算公式和参数
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

export default PricingComparePage;
