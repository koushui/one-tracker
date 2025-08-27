import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  Alert,
  Chip,
  Stack,
} from "@mui/material";
import {
  GitHub as GitHubIcon,
  Terminal as TerminalIcon,
  Api as ApiIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudDone as CloudIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import { useAuth } from "@frontend/hooks/useAuth";

const HomePage = () => {
  const theme = useTheme();
  const { isAuthenticated, login } = useAuth();

  const features = [
    {
      icon: <ApiIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: "多源站价格聚合",
      description: "支持 OneHub、NewAPI、OneAPI 等中转平台，自动解析价格数据并统一标准量化计算",
    },
    {
      icon: <TerminalIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      title: "统一价格计算",
      description: "基于充值比例、模型倍率、分组倍率等参数，精确计算每1K/1M Token的真实成本",
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      title: "使用场景评估",
      description: "基于真实场景的输入输出比例，自动计算最优供应商真实成本",
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      title: "透明价格公式",
      description: "完整展示价格计算公式和参数代入过程，让每一分钱的计算都清晰可见",
    },
    {
      icon: <CloudIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />,
      title: "高级筛选与分析",
      description: "支持多维度筛选、供应商概览分析、匿名显示模式，满足不同使用场景需求",
    },
    {
      icon: <CodeIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />,
      title: "开源 & 匿名使用",
      description: "项目完全开源，支持匿名在线比价，无需注册即可使用全部功能",
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
          py: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                One Tracker
              </Typography>
              <Typography variant="h5" color="text.secondary" paragraph>
                大模型中转站价格比价平台
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4, fontSize: "1.1rem" }}>
                统一不同供应商的定价口径，实时比价，智能追踪价格变化。 支持 OneHub、NewAPI、OneAPI
                等多种中转站，让您轻松找到最具性价比的模型服务。
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<GitHubIcon />}
                  size="large"
                  href="https://github.com//NekroAI/one-tracker"
                  sx={{ px: 4, py: 1.5 }}
                >
                  开源仓库
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ApiIcon />}
                  size="large"
                  href="/pricing"
                  sx={{ px: 4, py: 1.5 }}
                >
                  开始比价
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: "background.default",
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  position: "relative",
                }}
              >
                {/* 模拟价格比较界面 */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  💰 实时价格比较
                </Typography>

                {/* 模型卡片示例 */}
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      mb: 1,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        gpt-4o-mini
                      </Typography>
                      <Chip label="OpenAI" size="small" color="primary" variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                      已选择：供应商A • 0.5x 倍率
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label="综合价格: ¥1.50/1M" size="small" color="success" />
                      <Chip label="最优" size="small" color="success" variant="outlined" />
                      <Chip label="已选" size="small" color="info" variant="outlined" />
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      mb: 1,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        claude-3-5-sonnet-20241022
                      </Typography>
                      <Chip label="Anthropic" size="small" color="primary" variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                      已选择：供应商B • 1x 倍率
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label="综合价格: ¥24.00/1M" size="small" color="warning" />
                      <Chip label="#2" size="small" variant="outlined" />
                      <Chip label="已选" size="small" color="info" variant="outlined" />
                    </Stack>
                  </Box>
                </Box>

                {/* 功能特性展示 */}
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, bgcolor: "success.main", borderRadius: "50%" }} />
                    <Typography variant="caption" color="text.secondary">
                      智能供应商选择
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, bgcolor: "info.main", borderRadius: "50%" }} />
                    <Typography variant="caption" color="text.secondary">
                      透明价格公式
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, bgcolor: "warning.main", borderRadius: "50%" }} />
                    <Typography variant="caption" color="text.secondary">
                      高级筛选分析
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6, fontWeight: "bold" }}>
          为什么选择 One Tracker？
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How it Works */}
      <Box sx={{ bgcolor: "background.default", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6, fontWeight: "bold" }}>
            工作原理
          </Typography>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
                1. 配置供应商源站
              </Typography>
              <Typography variant="body1" paragraph>
                在价格比较页面添加您需要比价的API中转站，配置充值比例、基准价格和模型过滤策略。支持
                OneHub、NewAPI、OneAPI 等主流格式。
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
                2. 自动解析与标准化
              </Typography>
              <Typography variant="body1" paragraph>
                系统自动识别源站类型，解析模型信息、价格结构和分组配置，统一转换为标准化的价格数据。
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
                3. 智能供应商选择
              </Typography>
              <Typography variant="body1" paragraph>
                为每个模型自动选择最优供应商和分组，支持手动调整和批量操作，选择结果持久化存储。
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
                4. 综合分析与筛选
              </Typography>
              <Typography variant="body1">
                提供多维度筛选、供应商概览统计、匿名显示模式等高级功能，满足不同使用场景的分析需求。
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 4,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="h4" color="primary.main" sx={{ mb: 1, fontWeight: "bold" }}>
                  0 门槛
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  免注册免登录，立即免费使用
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <ApiIcon sx={{ fontSize: 80, color: theme.palette.primary.main, opacity: 0.3 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
          立即开始使用
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
          找到最具性价比的AI模型服务，优化您的成本支出
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<ApiIcon />}
          href="/pricing"
          sx={{ px: 6, py: 2, fontSize: "1.1rem" }}
        >
          免费开始使用
        </Button>
      </Container>
    </Box>
  );
};

export default HomePage;
