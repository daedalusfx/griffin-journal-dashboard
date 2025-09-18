import { TableCell, TableHead, TableRow, TableSortLabel } from "@mui/material";

  const headCells = [
    { id: 'symbol', label: 'نماد' }, { id: 'type', label: 'نوع' }, { id: 'entryDate', label: 'تاریخ ورود' },
    { id: 'exitDate', label: 'تاریخ خروج' }, { id: 'volume', label: 'حجم', numeric: true }, { id: 'pnl', label: 'سود / زیان', numeric: true },
    { id: 'strategy', label: 'استراتژی' },
    { id: 'checklist', label: 'بازبینی' }, // ستون جدید
    { id: 'actions', label: 'عملیات' },
  ];
  function EnhancedTableHead(props) {
    const { order, orderBy, onRequestSort } = props;
    const createSortHandler = (property) => (event) => { onRequestSort(event, property); };
    return (
      <TableHead>
        <TableRow sx={{ '& th': { backgroundColor: '#1e1e1e' } }}>
          {headCells.map((headCell) => (
            <TableCell key={headCell.id} align={headCell.numeric ? 'right' : 'left'} sortDirection={orderBy === headCell.id ? order : false}>
              <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : 'asc'} onClick={createSortHandler(headCell.id)}>
                {headCell.label}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    );
  }
  export default EnhancedTableHead
