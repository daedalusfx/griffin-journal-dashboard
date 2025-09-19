import { Box, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function ApiStatusIndicator() {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // یک endpoint ساده در API پایتون برای چک کردن وضعیت بسازید
                // فعلا از یک درخواست ساده استفاده می‌کنیم
                await fetch('http://127.0.0.1:4040/');
                setIsOnline(true);
            } catch (error) {
                setIsOnline(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000); // هر ۵ ثانیه چک کن

        return () => clearInterval(interval);
    }, []);

    return (
        <Tooltip title={isOnline ? "موتور هوشمند آنلاین است" : "موتور هوشمند آفلاین است. لطفاً لانچر پایتون را اجرا کنید."}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: isOnline ? 'success.main' : 'error.main',
                    boxShadow: `0 0 8px ${isOnline ? '#4caf50' : '#f44336'}`,
                }} />
                <Typography variant="caption">{isOnline ? 'Engine Online' : 'Engine Offline'}</Typography>
            </Box>
        </Tooltip>
    );
}