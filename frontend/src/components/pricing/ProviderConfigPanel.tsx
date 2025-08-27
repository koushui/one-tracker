import React, { useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Stack,
  Button,
  CircularProgress,
  Collapse,
  Box,
  Popover,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { PricingDataService, generateProviderColor } from "../../../../common";

// 供应商配置接口
export interface ProviderConfig {
  id: string;
  name: string;
  url: string;
  type: "onehub" | "newapi" | "oneapi";
  rechargeRatio: number;
  rateBaseline: number; // 基础价格基准，默认0.002
  color?: string; // 用户自定义颜色
  modelFilterMode: "none" | "whitelist" | "blacklist"; // 模型过滤模式
  modelFilters: string[]; // 模型过滤关键词
}

interface ProviderConfigPanelProps {
  providers: ProviderConfig[];
  onUpdateProvider: (id: string, field: keyof ProviderConfig, value: any) => void;
  onAddProvider: () => void;
  onRemoveProvider: (id: string) => void;
  onFetchPricing: () => void;
  loading: boolean;
  pricingService: PricingDataService;
  isLocked: boolean; // 是否锁定配置
  onToggleLock: () => void; // 切换锁定状态
}

// 颜色选择器组件
const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
}> = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // 预设颜色
  const presetColors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
  ];

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          bgcolor: value,
          border: 2,
          borderColor: "divider",
          cursor: "pointer",
          "&:hover": {
            borderColor: "primary.main",
          },
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, maxWidth: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            选择颜色
          </Typography>
          <Grid container spacing={1}>
            {presetColors.map((color) => (
              <Grid item key={color}>
                <Box
                  onClick={() => {
                    onChange(color);
                    handleClose();
                  }}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    bgcolor: color,
                    border: 1,
                    borderColor: value === color ? "primary.main" : "divider",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="自定义颜色"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#ffffff"
            />
          </Box>
        </Box>
      </Popover>
    </>
  );
};

const ProviderConfigPanel: React.FC<ProviderConfigPanelProps> = React.memo(
  ({
    providers,
    onUpdateProvider,
    onAddProvider,
    onRemoveProvider,
    onFetchPricing,
    loading,
    pricingService,
    isLocked,
    onToggleLock,
  }) => {
    const [expandedAdvanced, setExpandedAdvanced] = useState<{ [key: string]: boolean }>({});
    const [filterInputs, setFilterInputs] = useState<{ [key: string]: string }>({});

    const toggleAdvanced = (providerId: string) => {
      setExpandedAdvanced((prev) => ({
        ...prev,
        [providerId]: !prev[providerId],
      }));
    };

    // 处理中英文逗号分割的工具函数
    const parseFilters = (input: string): string[] => {
      // 支持中英文逗号分割
      return input
        .split(/[,，]/) // 使用正则表达式匹配中英文逗号
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    };

    // 获取输入框的值
    const getFilterInput = (providerId: string): string => {
      // 如果有本地输入状态，使用本地状态
      if (filterInputs[providerId] !== undefined) {
        return filterInputs[providerId];
      }
      // 否则从provider数据中构建
      const provider = providers.find((p) => p.id === providerId);
      return (provider?.modelFilters || []).join(", ");
    };

    // 处理输入变化
    const handleFilterInputChange = (providerId: string, value: string) => {
      setFilterInputs((prev) => ({ ...prev, [providerId]: value }));
    };

    // 处理输入失焦，应用过滤器
    const handleFilterInputBlur = (providerId: string) => {
      const input = filterInputs[providerId];
      if (input !== undefined) {
        const filters = parseFilters(input);
        onUpdateProvider(providerId, "modelFilters", filters);
        // 清除本地输入状态
        setFilterInputs((prev) => {
          const newState = { ...prev };
          delete newState[providerId];
          return newState;
        });
      }
    };

    return (
      <Paper sx={{ p: 2.5, mb: 3, opacity: isLocked ? 0.8 : 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            供应商配置
          </Typography>
          {!isLocked && (
            <Button startIcon={<AddIcon />} onClick={onAddProvider} size="small" variant="outlined">
              添加供应商
            </Button>
          )}
        </Stack>

        <Stack spacing={2}>
          {providers.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                bgcolor: "background.paper",
                borderRadius: 1,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                还没有配置供应商
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                点击上方"添加供应商"按钮开始配置您的第一个价格源站
              </Typography>
              <Button startIcon={<AddIcon />} onClick={onAddProvider} variant="contained">
                添加供应商
              </Button>
            </Box>
          ) : (
            providers.map((provider) => (
              <Card
                key={provider.id}
                variant="outlined"
                sx={{ bgcolor: isLocked ? "surfaces.muted" : "background.paper" }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* 基础配置 - 水平布局 */}
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-end">
                    <TextField
                      label="名称"
                      value={provider.name}
                      onChange={(e) => onUpdateProvider(provider.id, "name", e.target.value)}
                      size="small"
                      disabled={isLocked}
                      sx={{ minWidth: 120 }}
                      placeholder="用于显示的名称"
                    />
                    <TextField
                      label="源站地址"
                      value={provider.url}
                      onChange={(e) => onUpdateProvider(provider.id, "url", e.target.value)}
                      size="small"
                      disabled={isLocked}
                      sx={{ flex: 1 }}
                      placeholder="https://api.example.com"
                    />
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>类型</InputLabel>
                      <Select
                        value={provider.type}
                        label="类型"
                        onChange={(e) => onUpdateProvider(provider.id, "type", e.target.value)}
                        disabled={isLocked}
                      >
                        {pricingService.getSupportedTypes().map((type) => (
                          <MenuItem key={type} value={type}>
                            {type === "onehub"
                              ? "OneHub"
                              : type === "newapi"
                                ? "NewAPI"
                                : type === "oneapi"
                                  ? "OneAPI"
                                  : type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="充值比例"
                      type="number"
                      value={provider.rechargeRatio}
                      onChange={(e) => onUpdateProvider(provider.id, "rechargeRatio", parseFloat(e.target.value) || 1)}
                      size="small"
                      inputProps={{ step: 0.1, min: 0.1 }}
                      disabled={isLocked}
                      sx={{ minWidth: 100 }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="高级配置">
                        <IconButton
                          size="small"
                          onClick={() => toggleAdvanced(provider.id)}
                          color={expandedAdvanced[provider.id] ? "primary" : "default"}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        color="error"
                        onClick={() => onRemoveProvider(provider.id)}
                        disabled={providers.length === 1 || isLocked}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* 高级配置折叠面板 - 优化对齐 */}
                  <Collapse in={expandedAdvanced[provider.id]}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                      <Stack spacing={3}>
                        {/* 第一行：价格基准和颜色配置 - 统一对齐 */}
                        <Grid container spacing={2} alignItems="flex-start">
                          <Grid item xs={12} sm={4} md={3}>
                            <TextField
                              label="价格基准"
                              type="number"
                              value={provider.rateBaseline || 0.002}
                              onChange={(e) =>
                                onUpdateProvider(provider.id, "rateBaseline", parseFloat(e.target.value) || 0.002)
                              }
                              size="small"
                              inputProps={{ step: 0.001, min: 0.001 }}
                              helperText="每 1 Token 的基准倍率价格，绝大部分 OneAPI 系衍生项目通常为 0.002"
                              disabled={isLocked}
                              fullWidth
                            />
                          </Grid>

                          <Grid item xs={12} sm={8} md={9}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <ColorPicker
                                value={provider.color || generateProviderColor(provider.url).solidColor}
                                onChange={(color) => onUpdateProvider(provider.id, "color", color)}
                              />
                              <TextField
                                label="颜色值"
                                value={provider.color || generateProviderColor(provider.url).solidColor}
                                onChange={(e) => onUpdateProvider(provider.id, "color", e.target.value)}
                                placeholder="#ffffff"
                                size="small"
                                disabled={isLocked}
                                sx={{ width: 100 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => onUpdateProvider(provider.id, "color", "")}
                                disabled={isLocked}
                                title="重置默认"
                              >
                                <RefreshIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Grid>
                        </Grid>

                        {/* 模型过滤配置 - 优化对齐 */}
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            模型过滤
                          </Typography>
                          <Stack spacing={2}>
                            <RadioGroup
                              row
                              value={provider.modelFilterMode || "none"}
                              onChange={(e) => onUpdateProvider(provider.id, "modelFilterMode", e.target.value)}
                            >
                              <FormControlLabel
                                value="none"
                                control={<Radio size="small" disabled={isLocked} />}
                                label="不过滤"
                              />
                              <FormControlLabel
                                value="whitelist"
                                control={<Radio size="small" disabled={isLocked} />}
                                label="白名单"
                              />
                              <FormControlLabel
                                value="blacklist"
                                control={<Radio size="small" disabled={isLocked} />}
                                label="黑名单"
                              />
                            </RadioGroup>

                            {(provider.modelFilterMode === "whitelist" || provider.modelFilterMode === "blacklist") && (
                              <Box>
                                <TextField
                                  fullWidth
                                  label={`${provider.modelFilterMode === "whitelist" ? "白名单" : "黑名单"}关键词`}
                                  placeholder="输入关键词，用逗号分隔"
                                  value={getFilterInput(provider.id)}
                                  onChange={(e) => handleFilterInputChange(provider.id, e.target.value)}
                                  onBlur={() => handleFilterInputBlur(provider.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleFilterInputBlur(provider.id);
                                    }
                                  }}
                                  size="small"
                                  disabled={isLocked}
                                />
                                {(provider.modelFilters || []).length > 0 && (
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                                    {(provider.modelFilters || []).map((filter, index) => (
                                      <Chip
                                        key={index}
                                        label={filter}
                                        size="small"
                                        onDelete={
                                          isLocked
                                            ? undefined
                                            : () => {
                                                const newFilters = [...(provider.modelFilters || [])];
                                                newFilters.splice(index, 1);
                                                onUpdateProvider(provider.id, "modelFilters", newFilters);
                                              }
                                        }
                                        color={provider.modelFilterMode === "whitelist" ? "success" : "error"}
                                        variant="outlined"
                                      />
                                    ))}
                                  </Stack>
                                )}
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>

        {/* 底部操作区域 - 简化 */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="center"
          spacing={2}
          sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}
        >
          {!isLocked ? (
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={onFetchPricing}
              disabled={loading}
              size="large"
            >
              {loading ? "拉取中..." : "拉取价格"}
            </Button>
          ) : (
            <Stack spacing={1} alignItems="center">
              <Button
                variant="contained"
                color="warning"
                startIcon={<RefreshIcon />}
                onClick={onToggleLock}
                size="large"
              >
                重新配置供应商
              </Button>
              <Typography variant="caption" color="text.secondary">
                重新配置将清除当前的价格数据
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>
    );
  },
);

ProviderConfigPanel.displayName = "ProviderConfigPanel";

export default ProviderConfigPanel;
