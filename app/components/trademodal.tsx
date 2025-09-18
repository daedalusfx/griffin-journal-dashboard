import { useConveyor } from "@/app/hooks/use-conveyor";
import { useTradeStore } from "@/app/utils/store";
import { Autocomplete, Box, Button, FormControl, Grid, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";


export const ChecklistFields = ({ control }) => (
    <>
        <Grid item xs={12}>
            <FormControl fullWidth>
                <InputLabel>احساس شما هنگام ورود؟</InputLabel>
                <Controller
                    name="checklist.emotion"
                    control={control}
                    defaultValue="نامشخص"
                    render={({ field }) => (
                        <Select {...field} label="احساس شما هنگام ورود؟">
                            <MenuItem value="آرام">آرام و طبق برنامه</MenuItem>
                            <MenuItem value="هیجان‌زده">هیجان‌زده (طمع)</MenuItem>
                            <MenuItem value="مضطرب">مضطرب (ترس)</MenuItem>
                            <MenuItem value="ترس از دست دادن (FOMO)">ترس از دست دادن (FOMO)</MenuItem>
                            <MenuItem value="نامشخص">نامشخص</MenuItem>
                        </Select>
                    )}
                />
            </FormControl>
        </Grid>
        <Grid item xs={12}>
            <FormControl fullWidth>
                <InputLabel>امتیاز به اجرای معامله (۱=ضعیف, ۵=عالی)</InputLabel>
                <Controller
                    name="checklist.executionScore"
                    control={control}
                    defaultValue={3}
                    render={({ field }) => (
                        <Select {...field} label="امتیاز به اجرای معامله (۱=ضعیف, ۵=عالی)">
                            <MenuItem value={1}>۱ - بسیار ضعیف</MenuItem>
                            <MenuItem value={2}>۲ - ضعیف</MenuItem>
                            <MenuItem value={3}>۳ - متوسط</MenuItem>
                            <MenuItem value={4}>۴ - خوب</MenuItem>
                            <MenuItem value={5}>۵ - عالی و طبق برنامه</MenuItem>
                        </Select>
                    )}
                />
            </FormControl>
        </Grid>
        <Grid item xs={12}>
             <Controller
                name="checklist.notes"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <TextField 
                        {...field} 
                        label="یادداشت" 
                        fullWidth 
                        multiline
                        rows={3}
                    />
                )}
            />
        </Grid>
    </>
);


export default function AddTradeModal({ open, handleClose }) { 
    const { handleSubmit, control, reset } = useForm();
    const addTrade = useTradeStore((state) => state.addTrade);
    const databaseApi = useConveyor('database');

    const onSubmit = async (data) => {
        const pnl = (data.type === 'Buy' ? 1 : -1) * (data.exitPrice - data.entryPrice) * data.volume;

        const tradePayload = {
            ...data,
            pnl: parseFloat(pnl) || 0,
            entryDate: new Date().toISOString(),
            exitDate: new Date().toISOString(),
            tags: data.tags || [], // FIX: اطمینان از وجود داشتن تگ‌ها
        };

        const newTradeWithId = await databaseApi.addTrade(tradePayload);
        
        // FIX: تبدیل رشته‌های تاریخ بازگشتی به آبجکت Date قبل از اضافه کردن به استور
        const finalTrade = {
            ...newTradeWithId,
            entryDate: new Date(newTradeWithId.entryDate),
            exitDate: new Date(newTradeWithId.exitDate),
        };
        addTrade(finalTrade);

        handleClose();
        reset({
            symbol: '', volume: '', entryPrice: '', exitPrice: '', strategy: '',
            checklist: { emotion: 'نامشخص', executionScore: 3, notes: '' },
            tags: []
        });
    };


    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 450, bgcolor: 'background.paper', border: '1px solid #444', boxShadow: 24, p: 4, borderRadius: 2 }}>
                <Typography variant="h6" component="h2" mb={2}>ثبت معامله جدید</Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><Controller name="symbol" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="نماد (Symbol)" fullWidth />} /></Grid>
                        <Grid item xs={6}><FormControl fullWidth><InputLabel>نوع</InputLabel><Controller name="type" control={control} defaultValue="Buy" render={({ field }) => (<Select {...field} label="نوع"><MenuItem value="Buy">خرید (Buy)</MenuItem><MenuItem value="Sell">فروش (Sell)</MenuItem></Select>)} /></FormControl></Grid>
                        <Grid item xs={6}><Controller name="volume" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="حجم (Volume)" type="number" fullWidth />} /></Grid>
                        <Grid item xs={6}><Controller name="entryPrice" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="قیمت ورود" type="number" fullWidth />} /></Grid>
                        <Grid item xs={6}><Controller name="exitPrice" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="قیمت خروج" type="number" fullWidth />} /></Grid>
                        <Grid item xs={12}><Controller name="strategy" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="استراتژی" fullWidth />} /></Grid>
                        
                        <Grid item xs={12}><Typography variant="subtitle1" mt={2}>بازبینی اولیه</Typography></Grid>
                        <ChecklistFields control={control} />
                        
                        {/* فیلد برچسب‌ها */}
                        <Grid item xs={12}>
                            <Controller
                                name="tags"
                                control={control}
                                defaultValue={[]}
                                render={({ field: { onChange, value } }) => (
                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        options={[]}
                                        value={value || []}
                                        onChange={(event, newValue) => {
                                            onChange(newValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="standard"
                                                label="برچسب‌ها"
                                                placeholder="یک برچسب تایپ کنید و Enter بزنید"
                                            />
                                        )}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} mt={2}><Button type="submit" variant="contained" color="primary" fullWidth>ثبت معامله</Button></Grid>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
}

