import { Box, Button, FormControl, Grid, InputLabel, Modal, Select, TextField, Typography } from "@mui/material";
// import { MenuItem } from "electron";
import { Controller, useForm } from "react-hook-form";
import { useTradeStore } from "../utils/store";



function AddTradeModal({ open, handleClose }) { 
    const { handleSubmit, control, reset } = useForm();
    const addTrade = useTradeStore((state) => state.addTrade);

    const onSubmit = (data) => {
        const pnl = (data.type === 'Buy' ? 1 : -1) * (data.exitPrice - data.entryPrice) * data.volume;
        addTrade({ ...data, pnl: parseFloat(pnl) });
        handleClose();
        reset();
    };
    
    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '1px solid #444', boxShadow: 24, p: 4, borderRadius: 2 }}>
                <Typography variant="h6" component="h2" mb={2}>ثبت معامله جدید</Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><Controller name="symbol" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="نماد (Symbol)" fullWidth />} /></Grid>
                        <Grid item xs={6}><FormControl fullWidth><InputLabel>نوع</InputLabel><Controller name="type" control={control} defaultValue="Buy" render={({ field }) => (<Select {...field} label="نوع"><MenuItem value="Buy">خرید (Buy)</MenuItem><MenuItem value="Sell">فروش (Sell)</MenuItem></Select>)} /></FormControl></Grid>
                        <Grid item xs={6}><Controller name="volume" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="حجم (Volume)" type="number" fullWidth />} /></Grid>
                        <Grid item xs={6}><Controller name="entryPrice" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="قیمت ورود" type="number" fullWidth />} /></Grid>
                        <Grid item xs={6}><Controller name="exitPrice" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="قیمت خروج" type="number" fullWidth />} /></Grid>
                        <Grid item xs={12}><Controller name="strategy" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="استراتژی" fullWidth />} /></Grid>
                        <Grid item xs={12}><Button type="submit" variant="contained" color="primary" fullWidth>ثبت</Button></Grid>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
}

export default AddTradeModal