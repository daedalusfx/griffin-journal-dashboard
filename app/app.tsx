import { AddCircleOutline, Delete, Edit, RateReview, UploadFile } from '@mui/icons-material'; // RateReview اضافه شد
import {
    Box, Button, Chip, Container, createTheme, CssBaseline, IconButton, Paper, Table, TableBody,
    TableCell, TableContainer, TablePagination, TableRow, ThemeProvider, Typography
} from '@mui/material'; // Chip اضافه شد
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import ChecklistModal from '@/app/components/checklistmodal'; // مودال جدید
import DashboardStats from '@/app/components/dashboardstate';
import EquityCurveChart from '@/app/components/equitycurvechart';
import EnhancedTableHead from '@/app/components/table';
import AddTradeModal from '@/app/components/trademodal';
import { useConveyor } from '@/app/hooks/use-conveyor';
import { Trade, useTradeStore } from '@/app/utils/store'; // Trade type اضافه شد
import { getComparator, stableSort } from '@/app/utils/tablelogic';


const darkTheme = createTheme({ 
    palette: {
        mode: 'dark',
        primary: { main: '#90caf9' },
        secondary: { main: '#f48fb1' },
        background: { default: '#121212', paper: '#1e1e1e' },
    },
    typography: {
        fontFamily: 'Vazirmatn, Arial, sans-serif',
        allVariants: { color: '#e0e0e0' }
    },
});

export default function App() {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const { trades, setTrades, addTrade, deleteTrade, importTrades, updateTradeReview } = useTradeStore();
    const fileApi = useConveyor('file');
    const databaseApi = useConveyor('database');
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('entryDate');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [checklistModalOpen, setChecklistModalOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

    const handleOpenChecklistModal = (trade: Trade) => {
        setSelectedTrade(trade);
        setChecklistModalOpen(true);
    };

    const handleCloseChecklistModal = () => {
        setChecklistModalOpen(false);
        setSelectedTrade(null);
    };


    const handleImportClick = async () => {
        // ۱. خواندن معاملات از فایل متاتریدر
        const importedTrades = await fileApi.readTradesFromDb();
        if (importedTrades && importedTrades.length > 0) {
            // ۲. ارسال معاملات خوانده شده به بک‌اند برای ذخیره‌سازی دسته‌جمعی
            const allTradesFromDb = await databaseApi.bulkAddTrades(importedTrades);
    
            // ۳. به‌روزرسانی کامل رابط کاربری با لیست جدید از دیتابیس
            setTrades(allTradesFromDb);
        }
    };

    const handleRequestSort = (event, property) => { 
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    const handleChangePage = (event, newPage) => { setPage(newPage); };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDeleteTrade = async (id: number) => {
        await databaseApi.deleteTrade(id); // 1. حذف از دیتابیس
        deleteTrade(id);                  // 2. حذف از رابط کاربری (store)
    };
    

    const sortedTrades = useMemo(() => stableSort(trades, getComparator(order, orderBy)), [trades, order, orderBy]);

useEffect(() => {
    const loadInitialData = async () => {
        console.log("Loading initial trades from database...");
        const initialTrades = await databaseApi.loadTrades();
        setTrades(initialTrades);
        console.log(`${initialTrades.length} trades loaded.`);
    };
    // اطمینان حاصل می‌کنیم که conveyor آماده است
    if (window.conveyor) {
       loadInitialData();
    }
}, [databaseApi, setTrades]);



    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h4" component="h1">ژورنال معاملاتی</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="outlined" startIcon={<UploadFile />} onClick={handleImportClick}>
                            بارگذاری از متاتریدر 5
                        </Button>
                        <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => setAddModalOpen(true)}>
                            ثبت معامله جدید
                        </Button>
                    </Box>
                </Box>

                <DashboardStats />
                <EquityCurveChart />

                <Paper sx={{ width: '100%', mb: 2, backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                    <TableContainer>
                        <Table>
                            <EnhancedTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
                            <TableBody>
                                {sortedTrades.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                                    <TableRow hover key={row.id}>
                                        <TableCell>{row.symbol}</TableCell>
                                        <TableCell><Typography color={row.type === 'Buy' ? 'success.main' : 'error.main'}>{row.type}</Typography></TableCell>
                                        <TableCell>{row.entryDate && !isNaN(new Date(row.entryDate)) ? format(new Date(row.entryDate), 'yyyy/MM/dd HH:mm') : 'N/A'}</TableCell>
                                        <TableCell>{row.exitDate && !isNaN(new Date(row.exitDate)) ? format(new Date(row.exitDate), 'yyyy/MM/dd HH:mm') : 'N/A'}</TableCell>
                                        <TableCell align="right">{row.volume}</TableCell>
                                        <TableCell align="right"><Typography color={row.pnl >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold' }}>${row.pnl.toFixed(2)}</Typography></TableCell>
                                        <TableCell>{row.strategy}</TableCell>
                                        {/* ستون جدید برای بازبینی */}
                                        <TableCell>
                                            {row.checklist ? (
                                                <Chip 
                                                    label={`${row.checklist.executionScore} ★`} 
                                                    onClick={() => handleOpenChecklistModal(row)}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ cursor: 'pointer' }}
                                                />
                                            ) : (
                                                <IconButton size="small" onClick={() => handleOpenChecklistModal(row)} title="افزودن بازبینی">
                                                    <RateReview fontSize="inherit" />
                                                </IconButton>
                                            )}
                                        </TableCell>

                                        <TableCell sx={{ maxWidth: 200 }}>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {row.tags?.map(tag => (
            <Chip key={tag} label={tag} size="small" />
        ))}
    </Box>
</TableCell>

                                        <TableCell>
                                            <IconButton size="small"><Edit fontSize="inherit" /></IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteTrade(row.id)}><Delete fontSize="inherit" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]} component="div" count={trades.length}
                        rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="تعداد در صفحه"
                    />
                </Paper>
                
                <AddTradeModal open={addModalOpen} handleClose={() => setAddModalOpen(false)} />
                <ChecklistModal open={checklistModalOpen} handleClose={handleCloseChecklistModal} trade={selectedTrade} />

            </Container>
        </ThemeProvider>
    );
}

