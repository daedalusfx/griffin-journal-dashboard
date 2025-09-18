import { Box, Card, CardContent, Grid, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useTradeStore } from "../utils/store";
import EmotionPerformanceChart from "./EmotionPerformanceChart";
import ScorePerformanceChart from "./ScorePerformanceChart";
import TagPerformanceChart from "./TagPerformanceChart";

// کامپوننت کمکی برای مدیریت محتوای هر تب
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// کامپوننت آمار کلی که قبلاً داشتیم
function OverviewStats() {
    const trades = useTradeStore((state) => state.trades);
    const stats = useMemo(() => {
        if (trades.length === 0) return { totalPnl: 0, winRate: 0, avgProfit: 0, avgLoss: 0 };
        const totalPnl = trades.reduce((acc, trade) => acc + trade.pnl, 0);
        const winningTrades = trades.filter(trade => trade.pnl > 0);
        const losingTrades = trades.filter(trade => trade.pnl <= 0);
        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        const avgProfit = winningTrades.length > 0 ? winningTrades.reduce((acc, trade) => acc + trade.pnl, 0) / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((acc, trade) => acc + trade.pnl, 0) / losingTrades.length : 0;
        return { totalPnl, winRate, avgProfit, avgLoss };
    }, [trades]);

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}><Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}><CardContent><Typography color="text.secondary" gutterBottom>مجموع سود / زیان</Typography><Typography variant="h5" component="div" color={stats.totalPnl >= 0 ? 'success.main' : 'error.main'}>${stats.totalPnl.toFixed(2)}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={6} md={3}><Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}><CardContent><Typography color="text.secondary" gutterBottom>نرخ موفقیت</Typography><Typography variant="h5" component="div">{stats.winRate.toFixed(1)}%</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={6} md={3}><Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}><CardContent><Typography color="text.secondary" gutterBottom>متوسط سود</Typography><Typography variant="h5" component="div" color="success.main">${stats.avgProfit.toFixed(2)}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={6} md={3}><Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}><CardContent><Typography color="text.secondary" gutterBottom>متوسط زیان</Typography><Typography variant="h5" component="div" color="error.main">${stats.avgLoss.toFixed(2)}</Typography></CardContent></Card></Grid>
        </Grid>
    );
}


export default function AnalyticsDashboard() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Paper sx={{ width: '100%', mb: 4, backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} centered>
                    <Tab label="نمای کلی" />
                    <Tab label="تحلیل احساسات" />
                    <Tab label="تحلیل عملکرد اجرایی" />
                    <Tab label="تحلیل برچسب‌ها" /> 
                </Tabs>
            </Box>
            <TabPanel value={activeTab} index={0}>
                <OverviewStats />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
                <EmotionPerformanceChart />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
                <ScorePerformanceChart />
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
    <TagPerformanceChart />
</TabPanel>
        </Paper>
    );
}
