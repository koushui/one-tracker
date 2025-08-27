import React, { useState, useCallback } from "react";
import {
  Paper,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Box,
  Typography,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
// 视图选项接口
export interface ViewOptions {
  inputOutputRatio: [number, number]; // 输入输出比例 [输入权重, 输出权重]
  showKTokens: boolean; // 是否显示1K Token价格（false为1M Token）
  currency: string; // 货币单位显示
  sortBy: "name" | "price" | "providerCount" | "vendor" | "difference"; // 排序方式
  sortOrder: "asc" | "desc"; // 排序方向
  filterVendor: string; // 按厂商过滤
  onlyFavorites: boolean; // 仅显示收藏的模型
  hideHiddenModels: boolean; // 隐藏已隐藏的模型
  providerCountFilter: "all" | "single" | "multiple" | number; // 按供应商数量过滤
}

interface UnifiedFilterPanelProps {
  // 搜索相关
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredCount: number;
  totalCount: number;
  onClearSearch: () => void;

  // 批量操作
  onBatchFavorite: () => void;
  onBatchHide: () => void;
  onBatchSelectLowestPrice: () => void;
  onClearAllSelections: () => void;

  // 视图选项
  viewOptions: ViewOptions;
  onUpdateViewOptions: (updates: Partial<ViewOptions>) => void;
  availableVendors: string[];
  maxProviderCount: number;

  // 权重滑块防抖处理
  inputOutputRatio?: [number, number];
  onRatioChange?: (ratio: [number, number]) => void;
}

const UnifiedFilterPanel: React.FC<UnifiedFilterPanelProps> = ({
  searchQuery,
  onSearchChange,
  filteredCount,
  totalCount,
  onClearSearch,
  onBatchFavorite,
  onBatchHide,
  onBatchSelectLowestPrice,
  onClearAllSelections,
  viewOptions,
  onUpdateViewOptions,
  availableVendors,
  maxProviderCount,
  inputOutputRatio = viewOptions.inputOutputRatio,
  onRatioChange,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localRatio, setLocalRatio] = useState(inputOutputRatio[0]);

  // 防抖处理权重调节
  const handleRatioChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      const ratio = Array.isArray(newValue) ? newValue[0] : newValue;
      setLocalRatio(ratio);

      // 防抖更新
      const timeoutId = setTimeout(() => {
        const outputRatio = 10 - ratio;
        const newRatio: [number, number] = [ratio, outputRatio];
        if (onRatioChange) {
          onRatioChange(newRatio);
        } else {
          onUpdateViewOptions({ inputOutputRatio: newRatio });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    },
    [onRatioChange, onUpdateViewOptions],
  );

  return (
    <Paper sx={{ p: 2.5, mb: 3, bgcolor: "surfaces.elevated", borderRadius: 2 }}>
      <Stack spacing={2.5}>
        {/* 第一行：搜索框和主要控制 */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          {/* 搜索框 */}
          <TextField
            placeholder="支持搜索名称、厂商、功能标签..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={onClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 300 }}
            size="small"
          />

          {/* 右侧控制组 */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            {/* 统计信息 */}
            <Chip
              icon={<FilterListIcon />}
              label={`显示 ${filteredCount}/${totalCount}`}
              variant="outlined"
              color="primary"
              size="small"
            />

            {/* 单位切换 */}
            <ToggleButtonGroup
              value={viewOptions.showKTokens ? "1K" : "1M"}
              exclusive
              onChange={(_, value) => {
                if (value !== null) {
                  onUpdateViewOptions({ showKTokens: value === "1K" });
                }
              }}
              size="small"
            >
              <ToggleButton value="1K">1K TOKEN</ToggleButton>
              <ToggleButton value="1M">1M TOKEN</ToggleButton>
            </ToggleButtonGroup>

            {/* 高级筛选开关 */}
            <Button
              variant={showAdvancedFilters ? "contained" : "outlined"}
              startIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              size="small"
              sx={{ minWidth: 100 }}
            >
              {showAdvancedFilters ? "收起" : "筛选"}
            </Button>
          </Stack>
        </Stack>

        {/* 第二行：快捷操作按钮 */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            批量操作:
          </Typography>

          <Tooltip title={`收藏所有筛选结果（${filteredCount}个模型）`}>
            <Button
              variant="text"
              size="small"
              startIcon={<StarIcon />}
              onClick={onBatchFavorite}
              sx={{ minWidth: "auto", px: 1.5 }}
            >
              收藏 ({filteredCount})
            </Button>
          </Tooltip>

          <Tooltip title={`隐藏所有筛选结果（${filteredCount}个模型）`}>
            <Button
              variant="text"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={onBatchHide}
              sx={{ minWidth: "auto", px: 1.5 }}
            >
              隐藏 ({filteredCount})
            </Button>
          </Tooltip>

          <Tooltip title={`为所有筛选模型选择最低价供应商（${filteredCount}个模型）`}>
            <Button
              variant="text"
              size="small"
              startIcon={<TrendingDownIcon />}
              onClick={onBatchSelectLowestPrice}
              color="success"
              sx={{ minWidth: "auto", px: 1.5 }}
            >
              最低价 ({filteredCount})
            </Button>
          </Tooltip>

          <Tooltip title="清除所有选择和筛选">
            <Button
              variant="text"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onClearAllSelections}
              color="warning"
              sx={{ minWidth: "auto", px: 1.5 }}
            >
              重置
            </Button>
          </Tooltip>
        </Box>

        {/* 高级筛选面板 */}
        <Collapse in={showAdvancedFilters}>
          <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Stack spacing={2.5}>
              {/* 筛选控件行 */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
                {/* 厂商筛选 */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>厂商</InputLabel>
                  <Select
                    value={viewOptions.filterVendor}
                    label="厂商"
                    onChange={(e) => onUpdateViewOptions({ filterVendor: e.target.value })}
                  >
                    <MenuItem value="">全部</MenuItem>
                    {availableVendors.map((vendor) => (
                      <MenuItem key={vendor} value={vendor}>
                        {vendor}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* 供应商数量筛选 */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>供应商数量</InputLabel>
                  <Select
                    value={viewOptions.providerCountFilter}
                    label="供应商数量"
                    onChange={(e) => onUpdateViewOptions({ providerCountFilter: e.target.value as any })}
                  >
                    <MenuItem value="all">全部</MenuItem>
                    {maxProviderCount >= 1 && <MenuItem value="single">单一供应商</MenuItem>}
                    {maxProviderCount >= 2 && <MenuItem value="multiple">多个供应商</MenuItem>}
                    {(() => {
                      const options = [];
                      for (let i = 2; i <= Math.min(maxProviderCount, 10); i++) {
                        options.push(
                          <MenuItem key={i} value={i}>
                            恰好{i}个
                          </MenuItem>,
                        );
                      }
                      return options;
                    })()}
                    {maxProviderCount > 10 && <MenuItem value={11}>11个或更多</MenuItem>}
                  </Select>
                </FormControl>

                {/* 排序方式 */}
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>排序</InputLabel>
                  <Select
                    value={viewOptions.sortBy}
                    label="排序"
                    onChange={(e) => onUpdateViewOptions({ sortBy: e.target.value as any })}
                  >
                    <MenuItem value="name">名称</MenuItem>
                    <MenuItem value="price">价格</MenuItem>
                    <MenuItem value="providerCount">供应商数</MenuItem>
                    <MenuItem value="vendor">厂商</MenuItem>
                    <MenuItem value="difference">价差</MenuItem>
                  </Select>
                </FormControl>

                {/* 排序方向 */}
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>方向</InputLabel>
                  <Select
                    value={viewOptions.sortOrder}
                    label="方向"
                    onChange={(e) => onUpdateViewOptions({ sortOrder: e.target.value as any })}
                  >
                    <MenuItem value="asc">升序</MenuItem>
                    <MenuItem value="desc">降序</MenuItem>
                  </Select>
                </FormControl>

                {/* 显示选项 */}
                <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                  <Chip
                    label="仅收藏"
                    variant={viewOptions.onlyFavorites ? "filled" : "outlined"}
                    color={viewOptions.onlyFavorites ? "primary" : "default"}
                    onClick={() => onUpdateViewOptions({ onlyFavorites: !viewOptions.onlyFavorites })}
                    clickable
                    size="small"
                  />
                  <Chip
                    label="显示隐藏"
                    variant={!viewOptions.hideHiddenModels ? "filled" : "outlined"}
                    color={!viewOptions.hideHiddenModels ? "secondary" : "default"}
                    onClick={() => onUpdateViewOptions({ hideHiddenModels: !viewOptions.hideHiddenModels })}
                    clickable
                    size="small"
                  />
                </Box>
              </Box>

              {/* 使用场景权重 */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  使用场景权重 (输入:{localRatio} | 输出:{10 - localRatio})
                </Typography>
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={localRatio}
                    onChange={handleRatioChange}
                    min={0.5}
                    max={9.5}
                    step={0.5}
                    marks={[
                      { value: 5, label: "输出密集" },
                      { value: 7, label: "均衡" },
                      { value: 9, label: "输入密集" },
                    ]}
                    sx={{
                      "& .MuiSlider-thumb": { transition: "none" },
                      "& .MuiSlider-track": { transition: "none" },
                      "& .MuiSlider-mark": { backgroundColor: "action.disabled" },
                      "& .MuiSlider-markLabel": { fontSize: "0.75rem" },
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>
        </Collapse>
      </Stack>
    </Paper>
  );
};

export default UnifiedFilterPanel;
