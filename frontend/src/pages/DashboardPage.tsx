import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  useTheme,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Compare as CompareIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Groups as GroupsIcon,
  Calculate as CalculateIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const mainFeatures = [
    {
      title: "实时价格比较",
      description: "对比多个供应商的AI模型价格，支持动态分组切换和透明计算公式展示",
      icon: <CompareIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      action: () => navigate("/pricing"),
      color: "primary",
      features: ["多供应商实时对比", "动态分组切换", "透明计算公式", "1K/1M单位切换"],
    },
    {
      title: "供应商配置",
      description: "灵活配置OneAPI/NewAPI等多种格式供应商，支持模型过滤和个性化设置",
      icon: <SettingsIcon sx={{ fontSize: 48, color: theme.palette.secondary.main }} />,
      action: () => navigate("/pricing"),
      color: "secondary",
      features: ["多格式支持", "白名单/黑名单", "颜色自定义", "充值比例配置"],
    },
    {
      title: "智能选择",
      description: "自动为每个模型选择最优供应商，支持偏好记忆和批量操作",
      icon: <StarIcon sx={{ fontSize: 48, color: theme.palette.warning.main }} />,
      action: () => navigate("/pricing"),
      color: "warning",
      features: ["最优供应商推荐", "偏好持久化", "批量选择", "收藏管理"],
    },
  ];

  const technicalHighlights = [
    {
      icon: <SpeedIcon color="primary" />,
      title: "高性能架构",
      description: "基于Cloudflare全栈，支持SSR混合渲染，响应速度快",
    },
    {
      icon: <SecurityIcon color="success" />,
      title: "数据安全",
      description: "统一价值体系计算，确保价格数据准确性和一致性",
    },
    {
      icon: <VisibilityIcon color="info" />,
      title: "透明计算",
      description: "完整展示价格计算过程，用户可验证每一步计算逻辑",
    },
    {
      icon: <GroupsIcon color="warning" />,
      title: "多分组支持",
      description: "支持用户分组定价，自动选择最优分组进行价格计算",
    },
  ];

  const systemStats = [
    { label: "支持供应商格式", value: "3+", description: "OneAPI, NewAPI, OneHub" },
    { label: "价格计算精度", value: "6位", description: "精确到微分单位" },
    { label: "分组切换", value: "实时", description: "动态重新计算价格" },
    { label: "数据验证", value: "严格", description: "价格一致性检查" },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面标题和说明 */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
          One Tracker
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 800, mx: "auto" }}>
          基于Cloudflare全栈架构的One-API系列网站模型价格比价平台
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 900, mx: "auto" }}>
          统一换算为真实Token成本，提供按模型维度的跨站比价，支持动态分组切换和透明计算公式展示
        </Typography>

        {/* 匿名访问提示 */}
        <Alert severity="info" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
          <AlertTitle>匿名体验模式</AlertTitle>
          当前为匿名访问模式，所有功能均可免费使用。数据将保存在浏览器本地存储中。
        </Alert>

        <Button variant="contained" size="large" onClick={() => navigate("/pricing")} sx={{ mr: 2 }}>
          开始比价
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.open("https://github.com//NekroAI/one-tracker", "_blank")}
        >
          查看源码
        </Button>
      </Box>

      {/* 主要功能卡片 */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {mainFeatures.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: "100%",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[8],
                },
              }}
              onClick={feature.action}
            >
              <CardContent sx={{ p: 3, textAlign: "center" }}>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {feature.description}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                  {feature.features.map((feat, idx) => (
                    <Chip key={idx} label={feat} size="small" color={feature.color as any} variant="outlined" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 系统统计 */}
      <Paper sx={{ p: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
          系统能力
        </Typography>
        <Grid container spacing={3}>
          {systemStats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: "bold" }}>
                  {stat.value}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* 技术亮点 */}
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
        技术特性
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {technicalHighlights.map((highlight, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ mt: 0.5 }}>{highlight.icon}</Box>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {highlight.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {highlight.description}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 实现功能清单 */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
          已实现功能
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="多供应商价格实时对比" secondary="支持OneAPI/NewAPI/OneHub格式" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="动态分组价格计算" secondary="自动选择最优分组，支持手动切换" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="透明计算公式展示" secondary="完整显示价格计算过程和参数" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="供应商个性化配置" secondary="颜色自定义、模型过滤、充值比例" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="智能供应商选择" secondary="自动推荐最优供应商，支持批量操作" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="灵活的价格单位切换" secondary="支持1K/1M Token显示模式" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="输入输出比例调节" secondary="根据使用场景自定义权重" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="模型偏好管理" secondary="收藏、隐藏模型，支持本地持久化" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="数据质量保证" secondary="价格一致性检查，严格数据验证" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="响应式设计" secondary="支持桌面端和移动端访问" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
