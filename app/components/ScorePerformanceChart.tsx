import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTradeStore } from "../utils/store";


export default function ScorePerformanceChart() {
    const trades = useTradeStore((state) => state.trades);

    const chartData = useMemo(() => {
        const tradesWithChecklist = trades.filter(t => t.checklist);
        if (tradesWithChecklist.length === 0) return [];

        const scoreStats = tradesWithChecklist.reduce((acc, trade) => {
            const score = trade.checklist.executionScore;
            if (!acc[score]) {
                acc[score] = { pnl: 0, count: 0 };
            }
            acc[score].pnl += trade.pnl;
            acc[score].count++;
            return acc;
        }, {});

        const data = Object.entries(scoreStats).map(([score, stats]) => ({
            name: `امتیاز ${score} ★`,
            avgPnl: stats.pnl / stats.count,
            count: stats.count
        })).sort((a,b) => parseInt(a.name.split(" ")[1]) - parseInt(b.name.split(" ")[1]));

        return data;

    }, [trades]);

     if (chartData.length === 0) {
        return <Typography p={3} textAlign="center">داده‌ای برای تحلیل امتیاز اجرایی وجود ندارد. لطفاً بازبینی معاملات را کامل کنید.</Typography>;
    }

    return (
        <Box sx={{ width: '100%', height: 300 }}>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="avgPnl" name="میانگین سود/زیان" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
}
