import { Paper, Typography } from "@mui/material";
import { format } from "date-fns";
import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// کامپوننت جدید برای نمودار عملکرد
function EquityCurveChart({trades}) {

    const chartData = useMemo(() => {
        if (trades.length === 0) return [];
        
        const sortedTrades = [...trades].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
        
        let cumulativePnl = 0;
        return sortedTrades.map((trade, index) => {
            cumulativePnl += trade.pnl;
            return {
                name: `Trade #${index + 1}`,
                date: format(new Date(trade.exitDate), 'yyyy/MM/dd'),
                equity: cumulativePnl,
            };
        });
    }, [trades]);

    return (
        <Paper sx={{ width: '100%', mb: 4, p: 2, backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <Typography variant="h6" mb={2}>نمودار عملکرد (Equity Curve)</Typography>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="equity" name="سرمایه" stroke="#8884d8" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </Paper>
    );
}

export default EquityCurveChart

