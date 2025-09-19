import { Box, Paper, Typography } from "@mui/material";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTradeStore } from "../utils/store";

// تابع برای تشخیص سشن معاملاتی بر اساس ساعت UTC
const getTradingSession = (date: Date) => {
    const hour = date.getUTCHours();
    // تعریف بازه‌های زمانی برای هر سشن (به وقت UTC)
    if (hour >= 22 || hour < 7) return 'سشن آسیا'; // 22:00 - 06:59 UTC
    if (hour >= 7 && hour < 13) return 'سشن لندن'; // 07:00 - 12:59 UTC
    if (hour >= 13 && hour < 21) return 'سشن نیویورک'; // 13:00 - 20:59 UTC
    return 'خارج از سشن اصلی';
};


const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <Paper elevation={3} sx={{ padding: '10px', backgroundColor: '#333' }}>
                <Typography variant="body2">{`سشن: ${label}`}</Typography>
                <Typography variant="body2" color={data.totalPnl >= 0 ? 'success.main' : 'error.main'}>
                    {`مجموع سود/زیان: $${data.totalPnl.toFixed(2)}`}
                </Typography>
                <Typography variant="body2">{`نرخ موفقیت: ${data.winRate.toFixed(1)}%`}</Typography>
                <Typography variant="body2">{`تعداد معاملات: ${data.count}`}</Typography>
            </Paper>
        );
    }
    return null;
};

export default function SessionPerformanceChart() {
    const trades = useTradeStore((state) => state.trades);

    const chartData = useMemo(() => {
        const sessionStats = trades.reduce((acc, trade) => {
            const session = getTradingSession(new Date(trade.entryDate));
            if (!acc[session]) {
                acc[session] = { pnl: 0, count: 0, wins: 0 };
            }
            acc[session].pnl += trade.pnl;
            acc[session].count++;
            if (trade.pnl > 0) acc[session].wins++;
            return acc;
        }, {});
        
        const sessionOrder = ['سشن آسیا', 'سشن لندن', 'سشن نیویورک', 'خارج از سشن اصلی'];

        return Object.entries(sessionStats).map(([session, stats]) => ({
            name: session,
            totalPnl: stats.pnl,
            winRate: (stats.wins / stats.count) * 100,
            count: stats.count
        })).sort((a, b) => sessionOrder.indexOf(a.name) - sessionOrder.indexOf(b.name));

    }, [trades]);

    if (chartData.length === 0) {
        return <Typography p={3} textAlign="center">هیچ معامله‌ای برای تحلیل وجود ندارد.</Typography>;
    }

    return (
        <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CustomTooltip active={undefined} payload={undefined} label={undefined} />} cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}/>
                    <Bar dataKey="totalPnl" name="مجموع سود/زیان">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.totalPnl >= 0 ? '#4caf50' : '#f44336'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}