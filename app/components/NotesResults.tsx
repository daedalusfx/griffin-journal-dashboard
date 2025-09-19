import { Box, Chip, Grid, Paper, Typography } from '@mui/material';

export default function NotesResults({ data }) {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'success.light' }}>
                    <Typography variant="h6" color="success.main" gutterBottom>
                        کلمات کلیدی در معاملات سودده
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {data.winning_trade_keywords.length > 0 ? (
                            data.winning_trade_keywords.map(word => <Chip key={word} label={word} color="success" variant="outlined" />)
                        ) : (
                            <Typography variant="body2" color="text.secondary">یادداشتی یافت نشد.</Typography>
                        )}
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'error.light' }}>
                    <Typography variant="h6" color="error.main" gutterBottom>
                        کلمات کلیدی در معاملات زیان‌ده
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {data.losing_trade_keywords.length > 0 ? (
                           data.losing_trade_keywords.map(word => <Chip key={word} label={word} color="error" variant="outlined" />)
                        ) : (
                             <Typography variant="body2" color="text.secondary">یادداشتی یافت نشد.</Typography>
                        )}
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
}