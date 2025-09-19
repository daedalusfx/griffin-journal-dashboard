import { Alert, Box, Button, CircularProgress, Container, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import AnalysisCard from './ai/AnalysisCard';
import ApiStatusIndicator from './ai/ApiStatusIndicator';
import ClusterResults from './ClusterResults';
import NotesResults from './NotesResults';
import PsychologyResults from './PsychologyResults';

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

            if(data.message) { // Handle cases where backend sends a message instead of data
                setError(data.message);
                return;
            }

            setAnalysisResult(data);
        } catch (err) {
            setError(err instanceof TypeError ? "اتصال به موتور هوشمند برقرار نیست. لطفاً لانچر پایتون را اجرا کرده و فایل دیتابیس را انتخاب کنید." : `خطا: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Helper function to render the correct results component
    const renderResults = () => {
        if (!analysisResult) return null;

        switch(activeAnalysis) {
            case 'clusters':
                return <ClusterResults data={analysisResult.clusters} />;
            case 'notes':
                return <NotesResults data={analysisResult} />;
            case 'psychology':
                return <PsychologyResults data={analysisResult} />;
            default:
                return null;
        }
    }
    
    const analysisTypes = {
        clusters: { endpoint: 'analyze-clusters', title: 'کشف الگوهای سودآور' },
        notes: { endpoint: 'analyze-notes', title: 'تحلیل یادداشت‌ها' },
        psychology: { endpoint: 'analyze-psychology', title: 'تحلیل روانشناسی' }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <div>
                    <Typography variant="h4" component="h1">Griffin AI Analyst</Typography>
                    <Typography color="text.secondary">دستیار هوشمند شما برای کشف حقیقت در داده‌های معاملاتی.</Typography>
                </div>
                <ApiStatusIndicator />
            </Paper>

            <Paper sx={{ p: 3, mb: 4 }}>
                 <Typography variant="h6" gutterBottom>انواع تحلیل</Typography>
                 <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {Object.entries(analysisTypes).map(([key, { endpoint, title }]) => (
                        <Button 
                            key={key}
                            onClick={() => runAnalysis(endpoint, key)} 
                            variant={activeAnalysis === key ? "contained" : "outlined"}
                            disabled={isLoading}
                        >
                            {title}
                        </Button>
                    ))}
                </Box>
            </Paper>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="h6" sx={{ ml: 2, alignSelf: 'center' }}>در حال انجام تحلیل...</Typography>
                </Box>
            )}

            {error && !isLoading && <Alert severity="warning" sx={{ my: 2 }}>{error}</Alert>}
            
            {analysisResult && !isLoading && (
                <AnalysisCard title={`نتایج تحلیل: ${analysisTypes[activeAnalysis]?.title}`}>
                    {renderResults()}
                </AnalysisCard>
            )}
        </Container>
    );
}