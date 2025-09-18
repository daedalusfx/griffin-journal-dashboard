import { Box, Paper, Typography } from "@mui/material";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTradeStore } from "../utils/store";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <Paper elevation={3} sx={{ padding: '10px', backgroundColor: '#333' }}>
                <Typography variant="body2">{`برچسب: ${label}`}</Typography>
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

export default function TagPerformanceChart() {
    const trades = useTradeStore((state) => state.trades);

    const chartData = useMemo(() => {
        const tradesWithTags = trades.filter(t => t.tags && t.tags.length > 0);
        if (tradesWithTags.length === 0) return [];

        const tagStats = tradesWithTags.reduce((acc, trade) => {
            trade.tags.forEach(tag => {
                if (!acc[tag]) {
                    acc[tag] = { pnl: 0, count: 0, wins: 0 };
                }
                acc[tag].pnl += trade.pnl;
                acc[tag].count++;
                if (trade.pnl > 0) acc[tag].wins++;
            });
            return acc;
        }, {});

        return Object.entries(tagStats).map(([tag, stats]) => ({
            name: tag,
            totalPnl: stats.pnl,
            winRate: (stats.wins / stats.count) * 100,
            count: stats.count
        }));
    }, [trades]);

    if (chartData.length === 0) {
        return <Typography p={3} textAlign="center">هیچ معامله‌ای برچسب‌گذاری نشده است.</Typography>;
    }

    return (
        <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}/>
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
