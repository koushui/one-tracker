import React from "react";
import {
  Paper,
  Typography,
  Stack,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Chip,
  Box,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { ProviderConfig } from "./ProviderConfigPanel";
import { ViewOptions } from "./UnifiedFilterPanel";
import { generateProviderColor } from "../../../../common";

// 分组状态接口
export interface GroupState {
  groupId: string;
  groupName: string;
  providerName: string;
  rate: number;
  enabled: boolean;
}

interface GroupManagerProps {
  enabledGroups: GroupState[];
  providers: ProviderConfig[];
  viewOptions: ViewOptions;
  isAnonymousMode: boolean;
  onToggleGroup: (groupId: string) => void;
  onUpdateViewOptions: (updates: Partial<ViewOptions>) => void;
  onToggleAnonymousMode: (enabled: boolean) => void;
}

const GroupManager: React.FC<GroupManagerProps> = React.memo(
  ({
    enabledGroups,
    providers,
    viewOptions,
    isAnonymousMode,
    onToggleGroup,
    onUpdateViewOptions,
    onToggleAnonymousMode,
  }) => {
    // 管理每个供应商分组的展开状态，默认都折叠
    const [expandedProviders, setExpandedProviders] = React.useState<Record<string, boolean>>({});

    if (enabledGroups.length === 0) {
      return null;
    }

    // 切换供应商分组的展开状态
    const toggleProviderExpansion = (providerName: string) => {
      setExpandedProviders((prev) => ({
        ...prev,
        [providerName]: !prev[providerName],
      }));
    };

    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h5">
            分组管理
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              可手动禁用分组以过滤价格
            </Typography>
          </Typography>

          {/* 匿名显示开关 */}
          <FormControlLabel
            control={
              <Switch
                checked={isAnonymousMode}
                onChange={(e) => onToggleAnonymousMode(e.target.checked)}
                size="small"
              />
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

        {/* 按供应商分组显示分组 */}
        {Array.from(new Set(enabledGroups.map((g: GroupState) => g.providerName))).map((providerName: string) => {
          const providerGroups = enabledGroups.filter((g: GroupState) => g.providerName === providerName);
          const provider = providers.find((p) => p.name === providerName);
          const providerColor = provider?.color || generateProviderColor(provider?.url || "").solidColor;

          return (
            <Accordion
              key={providerName}
              expanded={expandedProviders[providerName] || false}
              onChange={() => toggleProviderExpansion(providerName)}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    alignItems: "center",
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: providerColor,
                      fontSize: "0.875rem",
                      fontWeight: "bold",
                    }}
                  >
                    {providerName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    {providerName}
                  </Typography>
                  <Chip label={`${providerGroups.length} 个分组`} size="small" variant="outlined" sx={{ ml: "auto" }} />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {providerGroups.map((group: GroupState) => (
                    <Grid item xs={12} sm={6} md={4} key={group.groupId}>
                      <Card
                        variant="outlined"
                        sx={{
                          opacity: group.enabled ? 1 : 0.5,
                          transition: "opacity 0.2s ease-in-out",
                          borderColor: group.enabled ? providerColor : "divider",
                          "&:hover": {
                            borderColor: providerColor,
                          },
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {group.groupName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                倍率: {group.rate}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => onToggleGroup(group.groupId)}
                              sx={{
                                color: group.enabled ? providerColor : "action.disabled",
                              }}
                            >
                              {group.enabled ? <VisibilityIcon /> : <VisibilityOffIcon />}
                            </IconButton>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Paper>
    );
  },
);

GroupManager.displayName = "GroupManager";

export default GroupManager;
