import { Info } from '@mui/icons-material';
import { Box, Grid, Paper, Tooltip, Typography } from '@mui/material';

const StatCard = ({ title, value, tooltip }) => (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" color="text.secondary">{title}</Typography>
            <Tooltip title={tooltip}>
                <Info sx={{ fontSize: 16, color: 'grey.500' }} />
            </Tooltip>
        </Box>
        <Typography variant="h5" component="p">{value}</Typography>
    </Paper>
);

export default function PsychologyResults({ data }) {
    const formatPnl = (pnl) => (
        <Typography component="span" color={pnl >= 0 ? 'success.main' : 'error.main'}>
            ${pnl.toFixed(2)}
        </Typography>
    );

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <StatCard 
                    title="میانگین سود روزانه (با پایبندی بالا به قوانین)"
                    value={formatPnl(data.adherence_impact.high_adherence_avg_pnl)}
                    tooltip="میانگین سود خالص در روزهایی که به قوانین استراتژی خود امتیاز بالای ۳ از ۵ داده‌اید."
                />
            </Grid>
             <Grid item xs={12} md={6}>
                <StatCard 
                    title="میانگین سود روزانه (با پایبندی پایین به قوانین)"
                    value={formatPnl(data.adherence_impact.low_adherence_avg_pnl)}
                    tooltip="میانگین سود خالص در روزهایی که به قوانین استراتژی خود امتیاز ۳ یا کمتر داده‌اید."
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <StatCard 
                    title="میانگین سود روزانه (روزهای منظم)"
                    value={formatPnl(data.impulsivity_cost.disciplined_days_avg_pnl)}
                    tooltip="میانگین سود خالص در روزهایی که هیچ معامله هیجانی ثبت نکرده‌اید."
                />
            </Grid>
             <Grid item xs={12} md={6}>
                 <StatCard 
                    title="میانگین سود روزانه (روزهای هیجانی)"
                    value={formatPnl(data.impulsivity_cost.impulsive_days_avg_pnl)}
                    tooltip="میانگین سود خالص در روزهایی که حداقل یک معامله هیجانی ثبت کرده‌اید."
                />
            </Grid>
        </Grid>
    );
}