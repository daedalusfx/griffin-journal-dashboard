import { Alert, Box, Button, CircularProgress, Container, Grid, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import AnalysisCard from './ai/AnalysisCard';
import ApiStatusIndicator from './ai/ApiStatusIndicator';

// کامپوننت‌های نمایش نتایج (می‌توانید این‌ها را در فایل‌های جداگانه قرار دهید)
const ClusterResults = ({ clusters }) => (
    <Grid container spacing={2}>
        {clusters.sort((a, b) => b.avg_pnl - a.avg_pnl).map(cluster => (
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
);


export default function AiAnalystPage() {
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

    const runAnalysis = async (endpoint: string, analysisType: string) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setActiveAnalysis(analysisType);

        try {
            const response = await fetch(`http://127.0.0.1:4040/${endpoint}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: 'خطای ناشناخته در سرور' }));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setAnalysisResult(data);
        } catch (err) {
            setError(err instanceof TypeError ? "اتصال به موتور هوشمند برقرار نیست. لطفاً لانچر پایتون را اجرا کرده و فایل دیتابیس را انتخاب کنید." : `خطا: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Typography variant="h4" component="h1">Griffin AI Analyst</Typography>
                    <Typography color="text.secondary">دستیار هوشمند شما برای کشف حقیقت در داده‌های معاملاتی.</Typography>
                </div>
                <ApiStatusIndicator />
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                <Button onClick={() => runAnalysis('analyze-clusters', 'clusters')} variant="contained" disabled={isLoading}>
                    کشف الگوهای سودآور
                </Button>
                {/* دکمه‌های دیگر را می‌توانید به همین شکل اضافه کنید */}
            </Box>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2, alignSelf: 'center' }}>در حال تحلیل داده‌ها...</Typography>
                </Box>
            )}

            {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

            {analysisResult && (
                <AnalysisCard title={`نتایج تحلیل: ${activeAnalysis}`}>
                    {activeAnalysis === 'clusters' && <ClusterResults clusters={analysisResult.clusters} />}
                    {/* کامپوننت‌های نتایج دیگر را اینجا رندر کنید */}
                </AnalysisCard>
            )}
        </Container>
    );
}