import { Box, Paper, Typography } from "@mui/material";
import { format } from 'date-fns-tz';
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTradeStore } from "../utils/store";

// تابع جدید و دقیق برای تشخیص سشن معاملاتی
const getTradingSession = (date: Date) => {
    const tradeDate = new Date(date);

    // گرفتن ساعت معامله به وقت محلی هر بازار مالی
    const londonHour = parseInt(format(tradeDate, 'H', { timeZone: 'Europe/London' }));
    const newYorkHour = parseInt(format(tradeDate, 'H', { timeZone: 'America/New_York' }));
    const tokyoHour = parseInt(format(tradeDate, 'H', { timeZone: 'Asia/Tokyo' }));

    // تعریف ساعات کاری محلی (این ساعت‌ها با DST تغییر نمی‌کنند)
    const isLondonOpen = londonHour >= 8 && londonHour < 17; // 8:00 AM - 4:59 PM به وقت لندن
    const isNewYorkOpen = newYorkHour >= 9 && newYorkHour < 17; // 9:00 AM - 4:59 PM به وقت نیویورک
    const isTokyoOpen = tokyoHour >= 9 && tokyoHour < 15;   // 9:00 AM - 2:59 PM به وقت توکیو

    // بررسی همپوشانی‌ها (مهم‌ترین زمان بازار) و سشن‌های اصلی
    if (isLondonOpen && isNewYorkOpen) return 'همپوشانی لندن و نیویورک';
    if (isNewYorkOpen) return 'سشن نیویورک';
    if (isLondonOpen) return 'سشن لندن';
    if (isTokyoOpen) return 'سشن آسیا';

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
        
        const sessionOrder = ['سشن آسیا', 'سشن لندن', 'همپوشانی لندن و نیویورک', 'سشن نیویورک', 'خارج از سشن اصلی'];

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