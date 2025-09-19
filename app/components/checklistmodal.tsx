import { useConveyor } from "@/app/hooks/use-conveyor";
import { Trade, TradeChecklist, useTradeStore } from "@/app/utils/store";
import { Attachment } from "@mui/icons-material";
import { Autocomplete, Box, Button, Chip, FormControl, Grid, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

interface ChecklistModalProps {
    open: boolean;
    handleClose: () => void;
    trade: Trade | null;
}

// تایپ فرم را گسترش می‌دهیم تا استراتژی را هم شامل شود
type ReviewFormData = TradeChecklist & { tags: string[], strategy: string };

export default function ChecklistModal({ open, handleClose, trade }: ChecklistModalProps) {
    const { handleSubmit, control, reset, setValue } = useForm<ReviewFormData>();
    const { updateTradeChecklist, updateTradeTags, updateTradeStrategy } = useTradeStore();
    const databaseApi = useConveyor('database');
    const fileApi = useConveyor('file');
    const { addAttachmentToTrade } = useTradeStore();




    const handleAddAttachment = async () => {
        if (!trade) return;

        // 1. فایل را انتخاب کرده و نام جدید آن را از بک‌اند بگیر
        const newAttachmentName = await fileApi.addAttachment(trade.id);

        if (newAttachmentName) {
            // 2. نام جدید را به دیتابیس اضافه کن
            await databaseApi.addAttachment(trade.id, newAttachmentName);

            // 3. رابط کاربری را آپدیت کن
            addAttachmentToTrade(trade.id, newAttachmentName);
        }
    };

    const handleOpenAttachment = async (fileName: string) => {
        if (!trade) return;
        await fileApi.openAttachment(fileName);
    };


    useEffect(() => {
        if (trade) {
            setValue('emotion', trade.checklist?.emotion || 'نامشخص');
            setValue('executionScore', trade.checklist?.executionScore || 3);
            setValue('notes', trade.checklist?.notes || '');
            setValue('tags', trade.tags || []);
            setValue('strategy', trade.strategy || ''); // <-- مقداردهی اولیه استراتژی
        } else {
            reset({ emotion: 'نامشخص', executionScore: 3, notes: '', tags: [], strategy: '' });
        }
    }, [trade, open, setValue, reset]);

    const onSubmit = async (data: ReviewFormData) => {
        if (trade) {
            const { tags, strategy, ...checklistData } = data;
            const finalTags = tags || [];

            // 1. ذخیره تغییرات در دیتابیس
            await databaseApi.updateTradeReview(trade.id, checklistData, finalTags, strategy);

            // 2. آپدیت رابط کاربری
            updateTradeChecklist(trade.id, checklistData);
            updateTradeTags(trade.id, finalTags);
            updateTradeStrategy(trade.id, strategy);
        }
        handleClose();
    };

    if (!trade) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'max-content', bgcolor: 'background.paper', border: '1px solid #444', boxShadow: 24, p: 4, borderRadius: 2 }}>
                <Typography variant="h6" component="h2" mb={2}>بازبینی معامله: {trade.symbol}</Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3} sx={{display:'flex',flexDirection:'column',width:'max-content'}}>
                        <Grid item xs={12}>
                            <Controller
                                name="strategy"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="استراتژی"
                                        fullWidth
                                        variant="standard"
                                    />
                                )}
                            />
                        </Grid>

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
                                        label="یادداشت و دلایل"
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                )}
                            />
                        </Grid>
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

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>ضمیمه‌ها</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {trade?.attachments?.map(att => (
                                    <Chip
                                        key={att}
                                        label={att.split('-').pop()}
                                        size="small"
                                        // این خط را اضافه کنید
                                        onClick={() => handleOpenAttachment(att)}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={<Attachment />}
                                onClick={handleAddAttachment}
                                fullWidth
                            >
                                افزودن عکس یا ویدیو
                            </Button>
                        </Grid>


                        <Grid item xs={12}><Button type="submit" variant="contained" color="primary" fullWidth>ذخیره بازبینی</Button></Grid>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
}
