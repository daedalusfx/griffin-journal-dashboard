import { Box, Grid, Paper, Typography } from "@mui/material";


function ClusterResults({data}) {
  return (
    <>

    <Grid container spacing={2}>
    {data.sort((a, b) => b.avg_pnl - a.avg_pnl).map(cluster => (
        <Grid item xs={12} md={6} key={cluster.cluster_id}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', borderColor: cluster.avg_pnl > 0 ? 'success.light' : 'error.light' }}>
                <Typography variant="h6" color={cluster.avg_pnl > 0 ? 'success.main' : 'error.main'}>
                    خوشه شماره {cluster.cluster_id} ({cluster.avg_pnl > 0 ? "الگوی سودآور ✨" : "الگوی زیان‌ده ☠️"})
                </Typography>
                <Typography><strong>میانگین سود/زیان:</strong> ${cluster.avg_pnl}</Typography>
                <Typography><strong>نرخ موفقیت:</strong> {cluster.win_rate_percent}%</Typography>
                <Box mt={1} pl={1} borderLeft={2} borderColor="grey.700">
                    <Typography variant="caption" display="block">نماد: {cluster.characteristics.most_common_symbol}</Typography>
                    <Typography variant="caption" display="block">نوع: {cluster.characteristics.most_common_type}</Typography>
                    <Typography variant="caption" display="block">احساس: {cluster.characteristics.most_common_emotion}</Typography>
                </Box>
            </Paper>
        </Grid>
    ))}
</Grid>
    </>
  )
}

export default ClusterResults
