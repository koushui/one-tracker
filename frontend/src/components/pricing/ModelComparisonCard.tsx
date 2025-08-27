import React from "react";
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  IconButton,
  Chip,
  Box,
  Divider,
  Badge,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  VisibilityOff as HideIcon,
  Visibility as ShowIcon,
  Chat as ChatIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  Psychology as PsychologyIcon,
} from "@mui/icons-material";
import { ViewOptions } from "./UnifiedFilterPanel";
import { generateProviderColor } from "../../../../common";
import {
  getAnonymousProviderName,
  getAnonymousGroupName,
  isProviderAnonymous,
} from "../../../../common/utils/anonymization";

// 模型比价信息接口
export interface ModelComparison {
  modelName: string;
  modelType: "tokens" | "times";
  providers: {
    providerName: string;
    providerUrl: string;
    inputPrice: number;
    outputPrice: number;
    perCallPrice?: number;
    availableGroups: { id: string; name: string; rate: number }[];
    bestGroup: { id: string; name: string; rate: number };
    isLowestPrice: boolean;
    priceRank: number;
    // 添加原始模型参数用于真实计算公式显示
    originalModelParams: {
      rateBaseline: number;
      modelRate: number;
      completeRate: number;
      perPrice?: number; // 按次计费时的原始perPrice
      rechargeRatio: number;
    };
  }[];
  lowestProvider: string;
  highestProvider: string;
  priceDifference: number; // 最高价与最低价的差异百分比
  tags: string[]; // 模型标签：对话、代码、多模态等
  vendor: string; // 模型厂商
}

interface ModelComparisonCardProps {
  model: ModelComparison;
  viewOptions: ViewOptions;
  isFavorite: boolean;
  isHidden: boolean;
  selectedProvider?: string;
  providerConfigs: Array<{ name: string; color?: string }>; // 供应商配置信息
  isAnonymousMode: boolean; // 全局匿名显示模式
  onToggleFavorite: (modelName: string) => void;
  onToggleHidden: (modelName: string) => void;
  onSelectProvider: (modelName: string, providerName: string) => void;
  onToggleGroupSelection: (modelName: string, providerName: string, groupId: string) => void;
  getSelectedGroup: (modelName: string, providerName: string) => string | undefined;
}

const ModelComparisonCard: React.FC<ModelComparisonCardProps> = React.memo(
  ({
    model,
    viewOptions,
    isFavorite,
    isHidden,
    selectedProvider,
    providerConfigs,
    isAnonymousMode,
    onToggleFavorite,
    onToggleHidden,
    onSelectProvider,
    onToggleGroupSelection,
    getSelectedGroup,
  }) => {
    // 获取供应商颜色的辅助函数
    const getProviderColor = (providerName: string) => {
      const config = providerConfigs.find((c) => c.name === providerName);
      if (config?.color) {
        return config.color;
      }
      // 如果没有配置颜色，使用基于URL的生成颜色作为后备
      const provider = model.providers.find((p) => p.providerName === providerName);
      return provider ? generateProviderColor(provider.providerUrl).solidColor : "text.secondary";
    };

    // 获取显示用的供应商名称（考虑匿名化）
    const getDisplayProviderName = (providerName: string): string => {
      if (isAnonymousMode) {
        return getAnonymousProviderName(providerName);
      }
      return providerName;
    };

    // 获取显示用的分组名称（考虑匿名化）
    const getDisplayGroupName = (providerName: string, groupName: string): string => {
      if (isAnonymousMode) {
        return getAnonymousGroupName(groupName);
      }
      return groupName;
    };

    // 渲染模型标签
    const renderModelTags = (tags: string[], modelName: string) => {
      const tagIcons: { [key: string]: React.ReactElement } = {
        对话: <ChatIcon fontSize="small" />,
        代码: <CodeIcon fontSize="small" />,
        识图: <ImageIcon fontSize="small" />,
        推理: <PsychologyIcon fontSize="small" />,
      };

      return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {tags.map((tag, index) => (
            <Chip
              key={`${modelName}-${tag}-${index}`}
              label={tag}
              size="small"
              variant="outlined"
              icon={tagIcons[tag] || undefined}
              sx={{ fontSize: "0.75rem" }}
            />
          ))}
        </Stack>
      );
    };

    // 渲染价格信息
    const renderPriceInfo = (provider: ModelComparison["providers"][0], modelType: "tokens" | "times") => {
      const [inputRatio, outputRatio] = viewOptions.inputOutputRatio;

      if (modelType === "times") {
        // 获取分组信息用于计算说明
        const selectedGroupId = getSelectedGroup(model.modelName, provider.providerName);
        const effectiveGroupId =
          selectedGroupId ||
          (provider.availableGroups.length > 0
            ? provider.availableGroups.reduce((lowest, current) => (current.rate < lowest.rate ? current : lowest)).id
            : undefined);
        const effectiveGroup = provider.availableGroups.find((g) => g.id === effectiveGroupId);
        const groupRate = effectiveGroup?.rate || 1;
        const originalPrice = (provider.perCallPrice || 0) / groupRate;

        // 使用真实的原始模型参数
        const { rateBaseline, modelRate, completeRate, perPrice, rechargeRatio } = provider.originalModelParams;

        const tooltipContent = (
          <Box sx={{ p: 1, maxWidth: 480 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              按次计费真实成本计算
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>模型参数：</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, ml: 1 }}>
              • 按次基价：{perPrice || "N/A"}
              <br />• 分组倍率：{groupRate}x
              <br />• 充值比例：{rechargeRatio}
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>计算公式：</strong>
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mb: 1,
                fontFamily: "monospace",
                bgcolor: "action.hover",
                p: 1,
                borderRadius: 1,
                fontSize: "0.85rem",
              }}
            >
              真实成本 = 按次基价 × 分组倍率 ÷ 充值比例
              <br />= {perPrice || "N/A"} × {groupRate} ÷ {rechargeRatio}
              <br />= {perPrice ? ((perPrice * groupRate) / rechargeRatio).toFixed(6) : "N/A"}
              <br />= ¥{(provider.perCallPrice || 0).toFixed(4)}/次
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {selectedGroupId ? "已手动选择分组" : effectiveGroup ? "自动选择最优分组" : "使用默认分组"} •
              基于站点价值体系计算
            </Typography>
          </Box>
        );

        return (
          <Tooltip title={tooltipContent} placement="top">
            <Box sx={{ cursor: "help" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                综合价格
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                ¥{(provider.perCallPrice || 0).toFixed(4)}/次
              </Typography>
            </Box>
          </Tooltip>
        );
      }

      // provider.inputPrice 和 outputPrice 是每1K tokens的价格（用户货币单位）
      // 统一基准：1K tokens，前端显示时只需转换单位
      const inputPricePer1K = provider.inputPrice;
      const outputPricePer1K = provider.outputPrice;

      // 根据显示选项决定显示单位
      const inputPriceDisplay = viewOptions.showKTokens ? inputPricePer1K : inputPricePer1K * 1000;
      const outputPriceDisplay = viewOptions.showKTokens ? outputPricePer1K : outputPricePer1K * 1000;
      const unit = viewOptions.showKTokens ? "1K" : "1M";

      const weightedPrice =
        (inputPriceDisplay * inputRatio + outputPriceDisplay * outputRatio) / (inputRatio + outputRatio);

      // 获取分组信息用于计算说明
      const selectedGroupId = getSelectedGroup(model.modelName, provider.providerName);
      const effectiveGroupId =
        selectedGroupId ||
        (provider.availableGroups.length > 0
          ? provider.availableGroups.reduce((lowest, current) => (current.rate < lowest.rate ? current : lowest)).id
          : undefined);
      const effectiveGroup = provider.availableGroups.find((g) => g.id === effectiveGroupId);
      const groupRate = effectiveGroup?.rate || 1;

      // 使用真实的原始模型参数
      const { rateBaseline, modelRate, completeRate, rechargeRatio } = provider.originalModelParams;

      const tooltipContent = (
        <Box sx={{ p: 1, maxWidth: 500 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
            Token计费真实成本计算
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>模型参数：</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, ml: 1 }}>
            • 价格基准：{rateBaseline}
            <br />• 模型倍率：{modelRate}x
            <br />• 输出倍率：{completeRate}x
            <br />• 分组倍率：{groupRate}x
            <br />• 充值比例：{rechargeRatio}
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>计算公式：</strong>
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 1,
              fontFamily: "monospace",
              bgcolor: "action.hover",
              p: 1,
              borderRadius: 1,
              fontSize: "0.8rem",
            }}
          >
            1K输入成本 = 价格基准 × 模型倍率 × 分组倍率 ÷ 充值比例
            <br />= {rateBaseline} × {modelRate} × {groupRate} ÷ {rechargeRatio}
            <br />= ¥{((rateBaseline * modelRate * groupRate) / rechargeRatio).toFixed(6)}/1K
            <br />
            <br />
            1K输出成本 = 价格基准 × 模型倍率 × 输出倍率 × 分组倍率 ÷ 充值比例
            <br />= {rateBaseline} × {modelRate} × {completeRate} × {groupRate} ÷ {rechargeRatio}
            <br />= ¥{((rateBaseline * modelRate * completeRate * groupRate) / rechargeRatio).toFixed(6)}/1K
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>
              加权综合价格（输入:输出比例 {inputRatio}:{outputRatio}）：
            </strong>
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 1,
              fontFamily: "monospace",
              bgcolor: "action.hover",
              p: 1,
              borderRadius: 1,
              fontSize: "0.8rem",
            }}
          >
            综合价格 = (输入成本×{inputRatio} + 输出成本×{outputRatio}) ÷ {inputRatio + outputRatio}
            <br />= (¥{inputPriceDisplay.toFixed(6)}/{unit}×{inputRatio} + ¥{outputPriceDisplay.toFixed(6)}/{unit}×
            {outputRatio}) ÷ {inputRatio + outputRatio}
            <br />= ¥{weightedPrice.toFixed(6)}/{unit}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {selectedGroupId ? "已手动选择分组" : effectiveGroup ? "自动选择最优分组" : "使用默认分组"} •
            基于本站统一价值体系计算
          </Typography>
        </Box>
      );

      return (
        <Tooltip title={tooltipContent} placement="top">
          <Box sx={{ cursor: "help" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              综合价格
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              color={provider.isLowestPrice ? "success.main" : "text.primary"}
            >
              ¥{weightedPrice.toFixed(4)}/{unit}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              输入: ¥{inputPriceDisplay.toFixed(4)}/{unit} | 输出: ¥{outputPriceDisplay.toFixed(4)}/{unit}
            </Typography>
          </Box>
        </Tooltip>
      );
    };

    // 渲染分组信息
    const renderGroupInfo = (provider: ModelComparison["providers"][0]) => {
      if (provider.availableGroups.length === 0) {
        return <Chip label="无分组" size="small" color="default" />;
      }

      const selectedGroupId = getSelectedGroup(model.modelName, provider.providerName);
      const selectedGroup = provider.availableGroups.find((g) => g.id === selectedGroupId);

      // 获取有效分组（手动选择或默认最低倍率）
      const effectiveGroupId =
        selectedGroupId ||
        (provider.availableGroups.length > 0
          ? provider.availableGroups.reduce((lowest, current) => (current.rate < lowest.rate ? current : lowest)).id
          : undefined);
      const effectiveGroup = provider.availableGroups.find((g) => g.id === effectiveGroupId);

      // 如果有有效分组，将其置顶
      let sortedGroups = [...provider.availableGroups];
      if (effectiveGroup) {
        sortedGroups = [effectiveGroup, ...sortedGroups.filter((g) => g.id !== effectiveGroupId)];
      } else {
        // 否则按倍率排序，最优的在前
        sortedGroups.sort((a, b) => a.rate - b.rate);
      }

      const maxDisplayGroups = 2; // 最多直接显示2个分组
      const displayGroups = sortedGroups.slice(0, maxDisplayGroups);
      const hiddenGroups = sortedGroups.slice(maxDisplayGroups);

      return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {displayGroups.map((group, index) => {
            const isManuallySelected = selectedGroupId === group.id;
            const isEffective = effectiveGroupId === group.id;
            const isDefaultOptimal = !selectedGroupId && index === 0; // 无手动选择时第一个是默认最优的

            return (
              <Tooltip
                key={group.id}
                title={`点击${isManuallySelected ? "取消" : ""}选择 ${getDisplayGroupName(provider.providerName, group.name)} - 倍率: ${group.rate}x${
                  isManuallySelected ? " (已手动选择)" : isDefaultOptimal ? " (默认最优)" : ""
                }`}
              >
                <Chip
                  label={`${getDisplayGroupName(provider.providerName, group.name)} ${group.rate}x`}
                  size="small"
                  color={
                    isManuallySelected
                      ? "primary"
                      : isDefaultOptimal
                        ? "success"
                        : group.rate <= 1
                          ? "success"
                          : group.rate <= 3
                            ? "warning"
                            : "error"
                  }
                  variant={isEffective ? "filled" : "outlined"}
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡到供应商选择
                    onToggleGroupSelection(model.modelName, provider.providerName, group.id);
                  }}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                />
              </Tooltip>
            );
          })}
          {hiddenGroups.length > 0 && (
            <Tooltip
              title={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                    其他可用分组 ({hiddenGroups.length}个) - 点击选择:
                  </Typography>
                  {hiddenGroups.map((group) => {
                    const isManuallySelected = selectedGroupId === group.id;
                    const isEffective = effectiveGroupId === group.id;

                    return (
                      <Box
                        key={group.id}
                        onClick={() => onToggleGroupSelection(model.modelName, provider.providerName, group.id)}
                        sx={{
                          display: "inline-block",
                          m: 0.25,
                          cursor: "pointer",
                        }}
                      >
                        <Chip
                          label={`${getDisplayGroupName(provider.providerName, group.name)} ${group.rate}x`}
                          size="small"
                          color={
                            isManuallySelected
                              ? "primary"
                              : group.rate <= 1
                                ? "success"
                                : group.rate <= 3
                                  ? "warning"
                                  : "error"
                          }
                          variant={isEffective ? "filled" : "outlined"}
                          sx={{
                            "&:hover": {
                              transform: "scale(1.05)",
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              }
            >
              <Chip
                label={`+${hiddenGroups.length}`}
                size="small"
                variant="outlined"
                sx={{
                  minWidth: "auto",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "action.hover",
                    transform: "scale(1.05)",
                  },
                }}
              />
            </Tooltip>
          )}
        </Stack>
      );
    };

    return (
      <Card
        variant="outlined"
        sx={{
          overflow: "visible",
          opacity: isHidden ? 0.6 : 1,
          transition: "all 0.2s ease-in-out",
          "&:hover": { boxShadow: 2 },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* 左右分布布局 */}
          <Grid container spacing={3}>
            {/* 左侧：模型信息摘要 */}
            <Grid item xs={12} md={3}>
              <Box sx={{ pr: 2 }}>
                {/* 模型名称和操作 */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography variant="h6" fontWeight="600" sx={{ fontSize: "1.1rem" }}>
                    {model.modelName}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleFavorite(model.modelName)}
                      color={isFavorite ? "warning" : "default"}
                    >
                      {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onToggleHidden(model.modelName)}
                      color={isHidden ? "error" : "default"}
                    >
                      {isHidden ? <HideIcon /> : <ShowIcon />}
                    </IconButton>
                  </Stack>
                </Stack>

                {/* 核心信息 */}
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>厂商：</strong>
                    {model.vendor} · <strong>供应商：</strong>
                    {model.providers.length}个
                  </Typography>

                  {model.priceDifference > 20 && (
                    <Typography variant="body2" color={model.priceDifference > 50 ? "error.main" : "warning.main"}>
                      <strong>价差：</strong>
                      {model.priceDifference.toFixed(0)}%
                    </Typography>
                  )}

                  {/* 选中供应商价格 */}
                  {(() => {
                    // 如果用户没有选择，显示未选择状态
                    if (!selectedProvider) {
                      return (
                        <Box sx={{ mt: 1, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            未选择供应商
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            点击右侧供应商卡片进行选择
                          </Typography>
                        </Box>
                      );
                    }

                    const selectedProviderData = model.providers.find((p) => p.providerName === selectedProvider);
                    if (!selectedProviderData) return null;

                    const unit = viewOptions.showKTokens ? "1K" : "1M";
                    const inputPrice = viewOptions.showKTokens
                      ? selectedProviderData.inputPrice
                      : selectedProviderData.inputPrice * 1000;
                    const outputPrice = viewOptions.showKTokens
                      ? selectedProviderData.outputPrice
                      : selectedProviderData.outputPrice * 1000;

                    return (
                      <Box sx={{ mt: 1, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="primary.main" gutterBottom>
                          {getDisplayProviderName(selectedProviderData.providerName)}{" "}
                          {selectedProviderData.isLowestPrice && "（最优）"}
                          {isAnonymousMode && (
                            <Chip
                              label="匿名"
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1, fontSize: "0.6rem", height: 16 }}
                            />
                          )}
                        </Typography>

                        {/* 显示选中的分组名称 */}
                        {(() => {
                          const selectedGroupId = getSelectedGroup(model.modelName, selectedProviderData.providerName);
                          const selectedGroup =
                            selectedProviderData.availableGroups.find((g) => g.id === selectedGroupId) ||
                            selectedProviderData.bestGroup;

                          if (selectedGroup) {
                            const displayGroupName = getDisplayGroupName(
                              selectedProviderData.providerName,
                              selectedGroup.name,
                            );
                            return (
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                <strong>分组：</strong>
                                {displayGroupName} ({selectedGroup.rate}x)
                              </Typography>
                            );
                          }
                          return null;
                        })()}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ¥
                          {(
                            inputPrice * viewOptions.inputOutputRatio[0] +
                            outputPrice * viewOptions.inputOutputRatio[1]
                          ).toFixed(4)}
                          /{unit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          输入: ¥{inputPrice.toFixed(4)} · 输出: ¥{outputPrice.toFixed(4)}
                        </Typography>
                      </Box>
                    );
                  })()}
                </Stack>
              </Box>
            </Grid>

            {/* 右侧：所有供应商卡片 */}
            <Grid item xs={12} md={9}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                供应商价格对比
              </Typography>
              <Grid container spacing={1.5}>
                {model.providers.map((provider, index) => {
                  // 只有用户明确选择时才显示选中状态
                  const isSelected = selectedProvider === provider.providerName;
                  const providerColor = getProviderColor(provider.providerName);

                  return (
                    <Grid item xs={12} sm={6} md={4} key={`${model.modelName}-${provider.providerName}`}>
                      <Card
                        variant="outlined"
                        onClick={() => onSelectProvider(model.modelName, provider.providerName)}
                        sx={{
                          height: "100%",
                          borderColor: provider.isLowestPrice ? "success.main" : isSelected ? providerColor : "divider",
                          borderWidth: provider.isLowestPrice || isSelected ? 2 : 1,
                          bgcolor: isSelected
                            ? `${providerColor}15`
                            : provider.isLowestPrice
                              ? "success.50"
                              : "background.paper",
                          position: "relative",
                          cursor: "pointer",
                          transition: "all 0.15s ease-in-out",
                          "&:hover": {
                            boxShadow: 2,
                            borderColor: provider.isLowestPrice ? "success.dark" : providerColor,
                            bgcolor: isSelected
                              ? `${providerColor}20`
                              : provider.isLowestPrice
                                ? "success.100"
                                : "surfaces.subtle",
                          },
                        }}
                      >
                        {/* 状态标签 - 避免重叠 */}
                        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                          <Stack direction="column" spacing={0.5} alignItems="flex-end">
                            {provider.isLowestPrice && (
                              <Chip
                                label="最优"
                                size="small"
                                color="success"
                                variant="filled"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                            )}
                            {isSelected && !provider.isLowestPrice && (
                              <Chip
                                label="已选"
                                size="small"
                                sx={{
                                  fontSize: "0.7rem",
                                  height: 20,
                                  bgcolor: providerColor,
                                  color: "white",
                                }}
                              />
                            )}
                          </Stack>
                        </Box>

                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            {/* 供应商名称和排名 - 简化 */}
                            <Stack direction="row" alignItems="center" justifyContent="start" spacing={1}>
                              <Typography variant="caption" color="text.secondary">
                                #{provider.priceRank}
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                fontWeight="600"
                                sx={{
                                  fontStyle: isAnonymousMode ? "italic" : "normal",
                                  opacity: isAnonymousMode ? 0.8 : 1,
                                }}
                              >
                                {getDisplayProviderName(provider.providerName)}
                                {isAnonymousMode && (
                                  <Chip
                                    label="匿名"
                                    size="small"
                                    variant="outlined"
                                    sx={{ ml: 1, fontSize: "0.6rem", height: 16 }}
                                  />
                                )}
                              </Typography>
                            </Stack>

                            {/* 价格信息 - 保持原有功能 */}
                            {renderPriceInfo(provider, model.modelType)}

                            {/* 分组信息 - 简化标题 */}
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                                分组
                              </Typography>
                              {renderGroupInfo(provider)}
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  },
);

ModelComparisonCard.displayName = "ModelComparisonCard";

export default ModelComparisonCard;
