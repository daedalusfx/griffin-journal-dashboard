import { Card, CardContent, Typography } from '@mui/material';

export default function AnalysisCard({ title, children }) {
    return (
        <Card sx={{ mt: 4, backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                    {title}
                </Typography>
                {children}
            </CardContent>
        </Card>
    );
}