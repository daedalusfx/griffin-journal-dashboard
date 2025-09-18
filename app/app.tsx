import { AddCircleOutline, Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  createTheme,
  CssBaseline,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  ThemeProvider,
  Typography
} from '@mui/material';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import DashboardStats from './components/dashboardstate';
import EquityCurveChart from './components/equitycurvechart';
import EnhancedTableHead from './components/table';
import AddTradeModal from './components/trademodal';
import { useTradeStore } from './utils/store';
import { getComparator, stableSort } from './utils/tablelogic';


// --- THEME CONFIGURATION ---
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






// --- MAIN APP COMPONENT ---
export default function App() {
    const [modalOpen, setModalOpen] = useState(false);
    const trades = useTradeStore((state) => state.trades);
    const deleteTrade = useTradeStore((state) => state.deleteTrade);
    
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('entryDate');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

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

    const sortedTrades = useMemo(() => stableSort(trades, getComparator(order, orderBy)), [trades, order, orderBy]);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" component="h1">ژورنال معاملاتی</Typography>
                    <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => setModalOpen(true)}>ثبت معامله جدید</Button>
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
                                        <TableCell><Typography color={row.type === 'Buy' ? 'success.main' : 'error.main'}>{row.type === 'Buy' ? 'خرید' : 'فروش'}</Typography></TableCell>
                                        <TableCell>{format(new Date(row.entryDate), 'yyyy/MM/dd HH:mm')}</TableCell>
                                        <TableCell>{format(new Date(row.exitDate), 'yyyy/MM/dd HH:mm')}</TableCell>
                                        <TableCell align="right">{row.volume}</TableCell>
                                        <TableCell align="right"><Typography color={row.pnl >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold' }}>${row.pnl.toFixed(2)}</Typography></TableCell>
                                        <TableCell>{row.strategy}</TableCell>
                                        <TableCell>
                                            <IconButton size="small"><Edit fontSize="inherit" /></IconButton>
                                            <IconButton size="small" onClick={() => deleteTrade(row.id)}><Delete fontSize="inherit" /></IconButton>
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
                
                <AddTradeModal open={modalOpen} handleClose={() => setModalOpen(false)} />
            </Container>
        </ThemeProvider>
    );
}

