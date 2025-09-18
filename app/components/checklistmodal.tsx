import { Trade, TradeChecklist, useTradeStore } from "@/app/utils/store";
import { Autocomplete, Box, Button, FormControl, Grid, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

interface ChecklistModalProps {
    open: boolean;
    handleClose: () => void;
    trade: Trade | null;
}

export default function ChecklistModal({ open, handleClose, trade }: ChecklistModalProps) {
    const { handleSubmit, control, reset, setValue } = useForm<TradeChecklist & { tags: string[] }>();
    const { updateTradeChecklist, updateTradeTags } = useTradeStore((state) => state);


    // هر بار که مودال برای یک معامله جدید باز می‌شود، فرم را با اطلاعات آن پر می‌کند
    useEffect(() => {
        if (trade && trade.checklist) {
            setValue('emotion', trade.checklist.emotion || 'نامشخص');
            setValue('executionScore', trade.checklist.executionScore || 3);
            setValue('notes', trade.checklist.notes || '');
            setValue('tags', trade.tags || []);
        } else {
            reset({ emotion: 'نامشخص', executionScore: 3, notes: '' });
        }
    }, [trade, open, setValue, reset]);

    const onSubmit = (data: TradeChecklist & { tags: string[] }) => {
        if (trade) {
            const { tags, ...checklistData } = data;
            updateTradeChecklist(trade.id, checklistData);
            updateTradeTags(trade.id, tags || []); 
        }
        handleClose();
    };

    if (!trade) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 450, bgcolor: 'background.paper', border: '1px solid #444', boxShadow: 24, p: 4, borderRadius: 2 }}>
                <Typography variant="h6" component="h2" mb={2}>بازبینی معامله: {trade.symbol}</Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>احساس شما هنگام ورود؟</InputLabel>
                                <Controller
                                    name="emotion"
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
                                    name="executionScore"
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
                                name="notes"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="یادداشت و دلایل (چه کاری را درست یا غلط انجام دادید؟)"
                                        fullWidth
                                        multiline
                                        rows={4}
                                    />
                                )}
                            />

                            <Grid item xs={12}>
                                <Controller
                                    name="tags"
                                    control={control}
                                    defaultValue={[]}
                                    render={({ field: { onChange, value } }) => (
                                        <Autocomplete
                                            multiple
                                            freeSolo // به کاربر اجازه می‌دهد تگ جدید بسازد
                                            options={['test tag']} // در آینده می‌توانیم تگ‌های پراستفاده را اینجا بگذاریم
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
                        </Grid>
                        <Grid item xs={12}><Button type="submit" variant="contained" color="primary" fullWidth>ذخیره بازبینی</Button></Grid>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
}
