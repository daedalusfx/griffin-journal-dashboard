import { useConveyor } from "@/app/hooks/use-conveyor";
import { Box, Button, Divider, FormControl, Grid, InputLabel, MenuItem, Modal, Paper, Select, TextField, Typography } from "@mui/material";
import { format } from 'date-fns';
import { Controller, useForm } from "react-hook-form";

// یک کامپوننت کمکی برای ایجاد هر بخش از فرم
const FormSection = ({ title, children }) => (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
        <Typography variant="subtitle1" color="primary.light" gutterBottom>{title}</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
            {children}
        </Grid>
    </Paper>
);

export default function DailyLogModal({ open, handleClose }) {
    const { handleSubmit, control, reset } = useForm();
    const databaseApi = useConveyor('database');

    const onSubmit = async (data) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const payload = {
            ...data,
            date: today,
            pre_market_focus: Number(data.pre_market_focus),
            pre_market_preparation: Number(data.pre_market_preparation),
            adherence_to_rules: Number(data.adherence_to_rules),
            impulsive_trades_count: Number(data.impulsive_trades_count || 0),
            hesitation_on_entry: Number(data.hesitation_on_entry),
            premature_exit_count: Number(data.premature_exit_count || 0),
            post_market_review_quality: Number(data.post_market_review_quality),
        };
        await databaseApi.saveDailyLog(payload);
        handleClose();
        reset();
    };
    
    const scoreOptions = [1, 2, 3, 4, 5].map(v => (
        <MenuItem key={v} value={v}>{v} - {['بسیار ضعیف', 'ضعیف', 'متوسط', 'خوب', 'عالی'][v-1]}</MenuItem>
    ));

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', maxWidth: '1000px', bgcolor: 'background.paper', border: '1px solid #444', boxShadow: 24, p: 4, borderRadius: 2 }}>
                <Typography variant="h6" component="h2" mb={3}>
                    ثبت گزارش روانشناسی روزانه ({format(new Date(), 'yyyy-MM-dd')})
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* --- Grid اصلی برای ساختار سه ستونی --- */}
                    <Grid container spacing={3}>
                        
                        {/* ستون ۱: قبل از بازار */}
                        <Grid item xs={12} md={4}>
                            <FormSection title="۱. آمادگی قبل از بازار">
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>میزان تمرکز</InputLabel>
                                        <Controller name="pre_market_focus" control={control} defaultValue={3} render={({ field }) => (<Select {...field} label="میزان تمرکز">{scoreOptions}</Select>)} />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>میزان آمادگی و تحلیل</InputLabel>
                                        <Controller name="pre_market_preparation" control={control} defaultValue={3} render={({ field }) => (<Select {...field} label="میزان آمادگی و تحلیل">{scoreOptions}</Select>)} />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>وضعیت ذهنی</InputLabel>
                                        <Controller name="mindfulness_state" control={control} defaultValue="آرام" render={({ field }) => (
                                            <Select {...field} label="وضعیت ذهنی">
                                                <MenuItem value="آرام">آرام</MenuItem>
                                                <MenuItem value="مضطرب">مضطرب</MenuItem>
                                                <MenuItem value="هیجان‌زده">هیجان‌زده</MenuItem>
                                                <MenuItem value="خسته">خسته</MenuItem>
                                            </Select>
                                        )} />
                                    </FormControl>
                                </Grid>
                            </FormSection>
                        </Grid>

                        {/* ستون ۲: حین بازار */}
                        <Grid item xs={12} md={4}>
                            <FormSection title="۲. نظم و انضباط در حین بازار">
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>پایبندی به قوانین</InputLabel>
                                        <Controller name="adherence_to_rules" control={control} defaultValue={3} render={({ field }) => (<Select {...field} label="پایبندی به قوانین">{scoreOptions}</Select>)} />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>میزان تردید در ورود</InputLabel>
                                        <Controller name="hesitation_on_entry" control={control} defaultValue={3} render={({ field }) => (<Select {...field} label="میزان تردید در ورود">{scoreOptions}</Select>)} />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <Controller name="impulsive_trades_count" control={control} defaultValue={0} render={({ field }) => <TextField {...field} label="معاملات هیجانی" type="number" fullWidth />} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Controller name="premature_exit_count" control={control} defaultValue={0} render={({ field }) => <TextField {...field} label="خروج زودهنگام" type="number" fullWidth />} />
                                </Grid>
                            </FormSection>
                        </Grid>

                        {/* ستون ۳: بعد از بازار */}
                        <Grid item xs={12} md={4}>
                            <FormSection title="۳. بازبینی و ریکاوری بعد از بازار">
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>کیفیت بازبینی</InputLabel>
                                        <Controller name="post_market_review_quality" control={control} defaultValue={3} render={({ field }) => (<Select {...field} label="کیفیت بازبینی">{scoreOptions}</Select>)} />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                     <FormControl fullWidth>
                                        <InputLabel>وضعیت احساسی نهایی</InputLabel>
                                        <Controller name="emotional_state_after" control={control} defaultValue="راضی" render={({ field }) => (
                                            <Select {...field} label="وضعیت احساسی نهایی">
                                                <MenuItem value="راضی">راضی</MenuItem>
                                                <MenuItem value="خشمگین">خشمگین</MenuItem>
                                                <MenuItem value="بی‌تفاوت">بی‌تفاوت</MenuItem>
                                                <MenuItem value="ناامید">ناامید</MenuItem>
                                            </Select>
                                        )} />
                                    </FormControl>
                                </Grid>
                            </FormSection>
                        </Grid>
                        
                        {/* بخش یادداشت‌ها و دکمه ذخیره در پایین */}
                        <Grid item xs={12}>
                             <Controller name="daily_lesson_learned" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="مهم‌ترین درسی که امروز یاد گرفتم" fullWidth multiline rows={3} />} />
                        </Grid>
                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" color="primary" fullWidth size="large">
                                ذخیره گزارش امروز
                           </Button>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
}