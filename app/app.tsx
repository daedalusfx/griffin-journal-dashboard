import { AddCircleOutline, Delete, Edit, EventNote, RateReview, UploadFile } from '@mui/icons-material';
import {
    Autocomplete, Box, Button, Chip, Container, createTheme, CssBaseline, IconButton, Paper, Table, TableBody,
    TableCell, TableContainer, TablePagination, TableRow, TextField, ThemeProvider, Typography
} from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import ChecklistModal from '@/app/components/checklistmodal';
import DashboardStats from '@/app/components/dashboardstate';
import EquityCurveChart from '@/app/components/equitycurvechart';
import EnhancedTableHead from '@/app/components/table';
import AddTradeModal from '@/app/components/trademodal';
import { useConveyor } from '@/app/hooks/use-conveyor';
import { Trade, useTradeStore } from '@/app/utils/store';
import { getComparator, stableSort } from '@/app/utils/tablelogic';
import DailyLogModal from './components/DailyLogModal';

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
    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
    const { trades, setTrades, deleteTrade } = useTradeStore();
    const fileApi = useConveyor('file');
    const databaseApi = useConveyor('database');
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('entryDate');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [checklistModalOpen, setChecklistModalOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [dailyLogModalOpen, setDailyLogModalOpen] = useState(false); 


    // فیلتر کردن معاملات بر اساس نماد انتخاب شده
    const filteredTrades = useMemo(() => {
        if (!selectedSymbol) {
            return trades;
        }
        return trades.filter(trade => trade.symbol === selectedSymbol);
    }, [trades, selectedSymbol]);

    // ایجاد لیست نمادهای منحصر به فرد برای فیلتر
    const uniqueSymbols = useMemo(() => {
        const symbols = trades.map(trade => trade.symbol);
        return [...new Set(symbols)];
    }, [trades]);

    const handleOpenAddModal = () => {
        setEditingTrade(null);
        setAddModalOpen(true);
    };

    const handleOpenEditModal = (trade: Trade) => {
        setEditingTrade(trade);
        setAddModalOpen(true);
    };

    const handleOpenChecklistModal = (trade: Trade) => {
        setSelectedTrade(trade);
        setChecklistModalOpen(true);
    };

    const handleCloseChecklistModal = () => {
        setChecklistModalOpen(false);
        setSelectedTrade(null);
    };

    const handleImportClick = async () => {
        const importedTrades = await fileApi.readTradesFromDb();
        if (importedTrades && importedTrades.length > 0) {
            const allTradesFromDb = await databaseApi.bulkAddTrades(importedTrades);
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
        await databaseApi.deleteTrade(id);
        deleteTrade(id);
    };

    const sortedTrades = useMemo(() => stableSort(filteredTrades, getComparator(order, orderBy)), [filteredTrades, order, orderBy]);

    useEffect(() => {
        const loadInitialData = async () => {
            console.log("Loading initial trades from database...");
            const initialTrades = await databaseApi.loadTrades();
            setTrades(initialTrades);
            console.log(`${initialTrades.length} trades loaded.`);
        };
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
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Autocomplete
                          options={uniqueSymbols}
                          value={selectedSymbol}
                          onChange={(event, newValue) => {
                            setSelectedSymbol(newValue);
                          }}
                          renderInput={(params) => <TextField {...params} label="فیلتر نماد" size="small" />}
                          sx={{ width: 200 }}
                          disableClearable={!selectedSymbol}
                        />
                        <Button variant="outlined" startIcon={<UploadFile />} onClick={handleImportClick}>
                            بارگذاری از متاتریدر 5
                        </Button>
                        <Button variant="outlined" color="secondary" startIcon={<EventNote />} onClick={() => setDailyLogModalOpen(true)}>
                            ثبت گزارش روز
                        </Button>
                        <Button variant="contained" startIcon={<AddCircleOutline />} onClick={handleOpenAddModal}>
                            ثبت معامله جدید
                        </Button>
                    </Box>
                </Box>
                
                {/* پاس دادن معاملات فیلتر شده به کامپوننت‌ها */}
                <DashboardStats trades={filteredTrades} />
                <EquityCurveChart trades={filteredTrades} />

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
                                            <IconButton size="small" onClick={() => handleOpenEditModal(row)}><Edit fontSize="inherit" /></IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteTrade(row.id)}><Delete fontSize="inherit" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredTrades.length}
                        rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="تعداد در صفحه"
                    />
                </Paper>

                <AddTradeModal
                    open={addModalOpen}
                    handleClose={() => setAddModalOpen(false)}
                    tradeToEdit={editingTrade}
                />
                <ChecklistModal open={checklistModalOpen} handleClose={handleCloseChecklistModal} trade={selectedTrade} />
                <DailyLogModal open={dailyLogModalOpen} handleClose={() => setDailyLogModalOpen(false)} />

            </Container>
        </ThemeProvider>
    );
}