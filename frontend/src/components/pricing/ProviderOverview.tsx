import React, { useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { ProviderConfig } from "./ProviderConfigPanel";
import { ViewOptions } from "./UnifiedFilterPanel";
import { ModelComparison } from "./ModelComparisonCard";
import { GroupState } from "./GroupManager";
import { generateProviderColor } from "../../../../common";
import { getAnonymousProviderName, getAnonymousGroupName } from "../../../../common/utils/anonymization";

// 供应商统计数据接口
interface ProviderStats {
  name: string;
  type: string;
  color: string;
  totalModels: number;
  supportedVendors: string[];
  lowestPriceCount: number; // 最低价模型数量
  averageRank: number; // 平均价格排名
  enabledGroups: number;
  totalGroups: number;
  groupDetails: Array<{
    id: string;
    name: string;
    rate: number;
    enabled: boolean;
    affectedModels: number;
  }>;
  // 价格竞争力指标
  competitiveness: {
    exclusiveModels: number; // 独家模型数量
    averageRate: number; // 平均分组倍率
  };
}

// 全局统计数据
interface GlobalStats {
  totalModels: number;
  totalProviders: number;
  exclusiveModels: number; // 只有一个供应商的模型
  competitiveModels: number; // 多个供应商的模型
  vendorDistribution: Record<string, number>; // 按厂商分布
  providerCountDistribution: Record<number, number>; // 按供应商数量分布
  priceRangeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

interface ProviderOverviewProps {
  providers: ProviderConfig[];
  modelComparisons: ModelComparison[];
  enabledGroups: GroupState[];
  viewOptions: ViewOptions;
  isAnonymousMode: boolean;
  onToggleGroup: (groupId: string) => void;
  onUpdateViewOptions: (updates: Partial<ViewOptions>) => void;
  onToggleAnonymousMode: (enabled: boolean) => void;
}

const ProviderOverview: React.FC<ProviderOverviewProps> = ({
  providers,
  modelComparisons,
  enabledGroups,
  viewOptions,
  isAnonymousMode,
  onToggleGroup,
  onUpdateViewOptions,
  onToggleAnonymousMode,
}) => {
  // 管理每个供应商的展开状态
  const [expandedProviders, setExpandedProviders] = React.useState<Record<string, boolean>>({});

  // 切换供应商展开状态
  const toggleProviderExpansion = (providerName: string) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [providerName]: !prev[providerName],
    }));
  };
  // 计算供应商统计数据
  const providerStats = useMemo((): ProviderStats[] => {
    return providers.map((provider) => {
      // 该供应商支持的模型
      const supportedModels = modelComparisons.filter((model) =>
        model.providers.some((p) => p.providerName === provider.name),
      );

      // 支持的厂商列表
      const supportedVendors = Array.from(new Set(supportedModels.map((model) => model.vendor))).sort();

      // 最低价模型数量（只统计有竞争的模型，排除单一供应商）
      const lowestPriceCount = supportedModels.filter(
        (model) =>
          model.providers.length > 1 && // 只统计有竞争的模型
          model.providers.some((p) => p.providerName === provider.name && p.isLowestPrice),
      ).length;

      // 平均价格排名
      const ranks = supportedModels
        .map((model) => {
          const providerData = model.providers.find((p) => p.providerName === provider.name);
          return providerData?.priceRank || 0;
        })
        .filter((rank) => rank > 0);
      const averageRank = ranks.length > 0 ? ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length : 0;

      // 分组信息
      const providerGroups = enabledGroups.filter((g) => g.providerName === provider.name);
      const enabledGroupsCount = providerGroups.filter((g) => g.enabled).length;

      // 计算每个分组影响的模型数量
      const groupDetails = providerGroups.map((group) => {
        const affectedModels = supportedModels.filter((model) => {
          const providerData = model.providers.find((p) => p.providerName === provider.name);
          return providerData?.availableGroups.some((g) => g.id === group.groupId.replace(`${provider.name}-`, ""));
        }).length;

        return {
          id: group.groupId,
          name: group.groupName,
          rate: group.rate,
          enabled: group.enabled,
          affectedModels,
        };
      });

      // 竞争力指标
      const exclusiveModels = supportedModels.filter((model) => model.providers.length === 1).length;

      // 平均分组倍率（用于显示平均优惠程度）
      const averageRate =
        groupDetails.length > 0 ? groupDetails.reduce((sum, g) => sum + g.rate, 0) / groupDetails.length : 1;

      return {
        name: provider.name,
        type: provider.type,
        color: provider.color || generateProviderColor(provider.url).solidColor,
        totalModels: supportedModels.length,
        supportedVendors,
        lowestPriceCount,
        averageRank: Math.round(averageRank * 10) / 10,
        enabledGroups: enabledGroupsCount,
        totalGroups: providerGroups.length,
        groupDetails,
        competitiveness: {
          exclusiveModels,
          averageRate: Math.round(averageRate * 100) / 100, // 保留2位小数
        },
      };
    });
  }, [providers, modelComparisons, enabledGroups]);

  // 计算全局统计数据
  const globalStats = useMemo((): GlobalStats => {
    const totalModels = modelComparisons.length;
    const totalProviders = providers.length;

    // 独家 vs 竞争模型
    const exclusiveModels = modelComparisons.filter((model) => model.providers.length === 1).length;
    const competitiveModels = totalModels - exclusiveModels;

    // 厂商分布
    const vendorDistribution = modelComparisons.reduce(
      (acc, model) => {
        acc[model.vendor] = (acc[model.vendor] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // 按供应商数量分布
    const providerCountDistribution = modelComparisons.reduce(
      (acc, model) => {
        const count = model.providers.length;
        acc[count] = (acc[count] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    // 价格区间分布（基于加权价格）
    const [inputRatio, outputRatio] = viewOptions.inputOutputRatio;
    const totalRatio = inputRatio + outputRatio;

    const weightedPrices = modelComparisons
      .map((model) => {
        const lowestProvider = model.providers.find((p) => p.isLowestPrice);
        if (!lowestProvider) return 0;

        return model.modelType === "tokens"
          ? (lowestProvider.inputPrice * inputRatio + lowestProvider.outputPrice * outputRatio) / totalRatio
          : lowestProvider.perCallPrice || 0;
      })
      .filter((price) => price > 0);

    // 定义价格区间
    const priceRanges = [
      { min: 0, max: 0.01, label: "≤ ¥0.01" },
      { min: 0.01, max: 0.05, label: "¥0.01-0.05" },
      { min: 0.05, max: 0.1, label: "¥0.05-0.1" },
      { min: 0.1, max: 0.5, label: "¥0.1-0.5" },
      { min: 0.5, max: 1, label: "¥0.5-1" },
      { min: 1, max: Infinity, label: "> ¥1" },
    ];

    const priceRangeDistribution = priceRanges.map((range) => {
      const count = weightedPrices.filter((price) => price > range.min && price <= range.max).length;
      return {
        range: range.label,
        count,
        percentage: totalModels > 0 ? (count / totalModels) * 100 : 0,
      };
    });

    return {
      totalModels,
      totalProviders,
      exclusiveModels,
      competitiveModels,
      vendorDistribution,
      providerCountDistribution,
      priceRangeDistribution,
    };
  }, [modelComparisons, providers.length, viewOptions.inputOutputRatio]);

  // 渲染供应商卡片
  const renderProviderCard = (stats: ProviderStats) => {
    const displayName = isAnonymousMode ? getAnonymousProviderName(stats.name) : stats.name;

    return (
      <Grid item xs={12} md={6} lg={4} key={stats.name}>
        <Card
          sx={{
            height: "100%",
            border: `2px solid ${stats.color}20`,
            "&:hover": {
              borderColor: `${stats.color}60`,
              transform: "translateY(-2px)",
              transition: "all 0.2s ease-in-out",
            },
          }}
        >
          <CardContent>
            {/* 供应商头部信息 */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: stats.color,
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {stats.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                  {displayName}
                  {isAnonymousMode && (
                    <Chip label="匿名" size="small" variant="outlined" sx={{ ml: 1, fontSize: "0.6rem", height: 16 }} />
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.type.toUpperCase()} • {stats.totalModels} 个模型
                </Typography>
              </Box>
            </Stack>

            {/* 核心指标 */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {stats.lowestPriceCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    最优价格
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary" fontWeight="bold">
                    {stats.averageRank}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    平均排名
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* 厂商覆盖 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                支持厂商 ({stats.supportedVendors.length})
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {stats.supportedVendors.slice(0, 3).map((vendor) => (
                  <Chip
                    key={vendor}
                    label={vendor}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem", height: 20 }}
                  />
                ))}
                {stats.supportedVendors.length > 3 && (
                  <Chip
                    label={`+${stats.supportedVendors.length - 3}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem", height: 20 }}
                  />
                )}
              </Box>
            </Box>

            {/* 分组状态 */}
            <Accordion
              expanded={expandedProviders[stats.name] || false}
              onChange={() => toggleProviderExpansion(stats.name)}
              sx={{
                boxShadow: "none",
                "&:before": { display: "none" },
                margin: 0,
                padding: 0,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  minHeight: "auto",
                  padding: 0,
                  "& .MuiAccordionSummary-content": {
                    margin: "8px 0",
                  },
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">
                      分组管理 ({stats.enabledGroups}/{stats.totalGroups})
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={stats.totalGroups > 0 ? (stats.enabledGroups / stats.totalGroups) * 100 : 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: `${stats.color}20`,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: stats.color,
                      },
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: "8px 0 0 0" }}>
                {/* 分组详细管理 */}
                <Stack spacing={1}>
                  {stats.groupDetails.map((group) => {
                    const displayGroupName = isAnonymousMode ? getAnonymousGroupName(group.name) : group.name;

                    return (
                      <Card key={group.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {displayGroupName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {group.rate}x 倍率 • {group.affectedModels} 个模型
                            </Typography>
                          </Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip
                              label={`${group.rate}x`}
                              size="small"
                              color={group.rate < 1 ? "success" : group.rate > 1 ? "error" : "default"}
                              variant="outlined"
                            />
                            <IconButton
                              size="small"
                              onClick={() => onToggleGroup(group.id)}
                              color={group.enabled ? "primary" : "default"}
                            >
                              {group.enabled ? <VisibilityIcon /> : <VisibilityOffIcon />}
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Card>
                    );
                  })}

                  {/* 批量操作 */}
                  {stats.groupDetails.length > 1 && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip
                        label="全部启用"
                        size="small"
                        clickable
                        onClick={() => {
                          stats.groupDetails.forEach((group) => {
                            if (!group.enabled) {
                              onToggleGroup(group.id);
                            }
                          });
                        }}
                        sx={{ fontSize: "0.7rem" }}
                      />
                      <Chip
                        label="全部禁用"
                        size="small"
                        clickable
                        onClick={() => {
                          stats.groupDetails.forEach((group) => {
                            if (group.enabled) {
                              onToggleGroup(group.id);
                            }
                          });
                        }}
                        sx={{ fontSize: "0.7rem" }}
                      />
                    </Stack>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* 竞争力指标 */}
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {stats.competitiveness.exclusiveModels}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    独家模型
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="bold" color="secondary">
                    {stats.competitiveness.averageRate}x
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    平均倍率
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (modelComparisons.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      {/* 头部信息和控制 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            供应商概览
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              宏观分析和分组管理
            </Typography>
          </Typography>
        </Box>

        {/* 匿名显示开关 */}
        <FormControlLabel
          control={
            <Switch checked={isAnonymousMode} onChange={(e) => onToggleAnonymousMode(e.target.checked)} size="small" />
          }
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">匿名显示</Typography>
              <Tooltip title="开启后将使用脱敏名称显示供应商和分组，用于截图展示">
                <FilterIcon fontSize="small" color="action" />
              </Tooltip>
            </Stack>
          }
        />
      </Stack>

      {/* 全局统计仪表板 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <AssessmentIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="primary">
              {globalStats.totalModels}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              总模型数
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <SpeedIcon sx={{ fontSize: 40, color: "secondary.main", mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="secondary">
              {globalStats.competitiveModels}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              竞争模型
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <StarIcon sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {globalStats.exclusiveModels}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              独家模型
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {Math.round((globalStats.competitiveModels / globalStats.totalModels) * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              竞争率
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 供应商卡片网格 */}
      <Grid container spacing={3}>
        {providerStats.map(renderProviderCard)}
      </Grid>
    </Paper>
  );
};

export default ProviderOverview;
