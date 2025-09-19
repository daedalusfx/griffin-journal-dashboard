import { useConveyor } from "@/app/hooks/use-conveyor";
import { useTradeStore } from "@/app/utils/store";
import { Autocomplete, Box, Button, Chip, FormControl, Grid, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from 'react-hot-toast';

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


export default function AddTradeModal({ open, handleClose, tradeToEdit }) {
    const { handleSubmit, control, reset } = useForm();
    const addTrade = useTradeStore((state) => state.addTrade);
    const updateTrade = useTradeStore((state) => state.updateTrade);
    const databaseApi = useConveyor('database');
    const [autocompleteOptions, setAutocompleteOptions] = useState({
        symbol: [],
        strategy: [],
        timeframe: [],
        riskRewardRatio: [],
        tags: [],
    });
    const isEditMode = !!tradeToEdit;
    // In app/components/trademodal.tsx


    const onSubmit = async (data) => {
        if (isEditMode) {
            const tradePayload = {
                ...tradeToEdit,
                ...data,
                pnl: tradeToEdit.pnl,
                tags: data.tags || [],
                chartLinks: data.chartLinks ? data.chartLinks.split(',').map(link => link.trim()) : [],
                entryDate: new Date(tradeToEdit.entryDate).toISOString(),
                exitDate: new Date(tradeToEdit.exitDate).toISOString(),
            };
            const updatedTradeFromDb = await databaseApi.updateTrade(tradePayload);
            updateTrade(updatedTradeFromDb);
            toast.success('معامله با موفقیت ویرایش شد.');

        } else {
            const pnl = (data.type === 'Buy' ? 1 : -1) * (data.exitPrice - data.entryPrice) * data.volume;
            const tradePayload = {
                ...data,
                pnl: parseFloat(pnl) || 0,
                entryDate: new Date().toISOString(),
                exitDate: new Date().toISOString(),
                tags: data.tags || [],
                chartLinks: data.chartLinks ? data.chartLinks.split(',').map(link => link.trim()) : [],
            };
            const newTradeWithId = await databaseApi.addTrade(tradePayload);
            addTrade(newTradeWithId);
            toast.success('معامله جدید با موفقیت ثبت شد.');

        }
        handleClose();
    };

    useEffect(() => {
        if (open) {
            Promise.all([
                databaseApi.getUniqueFieldValues('symbol'),
                databaseApi.getUniqueFieldValues('strategy'),
                databaseApi.getUniqueFieldValues('timeframe'),
                databaseApi.getUniqueFieldValues('riskRewardRatio'),
                databaseApi.getUniqueTags(), // <-- Fetching unique tags
            ]).then(([symbols, strategies, timeframes, rrs, tags]) => {
                setAutocompleteOptions({
                    symbol: symbols,
                    strategy: strategies,
                    timeframe: timeframes,
                    riskRewardRatio: rrs,
                    tags: tags,
                });
            }).catch(err => console.error("Failed to fetch autocomplete options:", err));

            if (isEditMode) {
                reset({
                    symbol: tradeToEdit.symbol,
                    type: tradeToEdit.type,
                    volume: tradeToEdit.volume,
                    entryPrice: tradeToEdit.entryPrice,
                    exitPrice: tradeToEdit.exitPrice,
                    strategy: tradeToEdit.strategy,
                    checklist: tradeToEdit.checklist || { emotion: 'نامشخص', executionScore: 3, notes: '' },
                    tags: tradeToEdit.tags || [],
                    riskRewardRatio: tradeToEdit.riskRewardRatio || '',
                    timeframe: tradeToEdit.timeframe || '',
                    accountType: tradeToEdit.accountType || 'Real',
                    outcome: tradeToEdit.outcome || 'Manual Close',
                    chartLinks: tradeToEdit.chartLinks ? tradeToEdit.chartLinks.join(', ') : '',
                });
            } else {
                reset({
                    symbol: '', volume: '', entryPrice: '', exitPrice: '', strategy: '',
                    checklist: { emotion: 'نامشخص', executionScore: 3, notes: '' },
                    tags: [],
                    riskRewardRatio: '',
                    timeframe: '',
                    accountType: 'Real',
                    outcome: 'Manual Close',
                    chartLinks: '',
                });
            }
        }
    }, [tradeToEdit, open, reset]);

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'max-content', bgcolor: 'background.paper', border: '1px solid #444', boxShadow: 24, p: 4, borderRadius: 2 }}>
                <Typography variant="h6" component="h2" mb={2}>
                    {isEditMode ? `ویرایش معامله: ${tradeToEdit.symbol}` : 'ثبت معامله جدید'}
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', alignContent: 'center', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                            <Grid item xs={12}>

                                <Controller name="symbol" control={control} defaultValue="" render={({ field: { onChange, value } }) => (
                                    <Autocomplete freeSolo options={autocompleteOptions.symbol} value={value || ''} onChange={(e, val) => onChange(val)}
                                        renderInput={(params) => <TextField {...params} label="نماد (Symbol)" fullWidth />}
                                    />
                                )} />

                            </Grid>
                            <Grid item xs={6}><FormControl fullWidth><InputLabel>نوع</InputLabel><Controller name="type" control={control} defaultValue="Buy" render={({ field }) => (<Select {...field} label="نوع"><MenuItem value="Buy">خرید (Buy)</MenuItem><MenuItem value="Sell">فروش (Sell)</MenuItem></Select>)} /></FormControl></Grid>
                            <Grid item xs={6}><Controller name="volume" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="حجم (Volume)" type="number" fullWidth />} /></Grid>
                            <Grid item xs={6}><Controller name="entryPrice" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="قیمت ورود" type="number" fullWidth />} /></Grid>
                            <Grid item xs={6}><Controller name="exitPrice" control={control} defaultValue="" render={({ field }) => <TextField {...field} label="قیمت خروج" type="number" fullWidth />} /></Grid>
                            <Grid item xs={12}>
                                <Controller name="strategy" control={control} defaultValue="" render={({ field: { onChange, value } }) => (
                                    <Autocomplete freeSolo options={autocompleteOptions.strategy} value={value || ''} onChange={(e, val) => onChange(val)}
                                        renderInput={(params) => <TextField {...params} label="استراتژی" fullWidth />}
                                    />
                                )} />

                            </Grid>
                        </div>


                        <Grid item xs={12} md={4} sx={{ width: '20%' }}>
                            <Typography variant="subtitle1" mt={2}>جزئیات تکمیلی</Typography>


                            <Controller name="riskRewardRatio" control={control} defaultValue="" render={({ field: { onChange, value } }) => (
                                <Autocomplete freeSolo options={autocompleteOptions.riskRewardRatio} value={value || ''} onChange={(e, val) => onChange(val)}
                                    renderInput={(params) => <TextField {...params} label="نسبت ریسک به ریوارد" fullWidth />}
                                />
                            )} />
                            <Controller name="timeframe" control={control} defaultValue="" render={({ field: { onChange, value } }) => (
                                <Autocomplete freeSolo options={autocompleteOptions.timeframe} value={value || ''} onChange={(e, val) => onChange(val)}
                                    renderInput={(params) => <TextField {...params} label="تایم فریم" fullWidth />}
                                />
                            )} />

                            <FormControl fullWidth margin="normal">
                                <InputLabel>نوع حساب</InputLabel>
                                <Controller name="accountType" control={control} defaultValue="Real" render={({ field }) => (
                                    <Select {...field} label="نوع حساب">
                                        <MenuItem value="Real">واقعی (Real)</MenuItem>
                                        <MenuItem value="Demo">آزمایشی (Demo)</MenuItem>
                                    </Select>
                                )} />
                            </FormControl>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>نتیجه معامله</InputLabel>
                                <Controller name="outcome" control={control} defaultValue="Manual Close" render={({ field }) => (
                                    <Select {...field} label="نتیجه معامله">
                                        <MenuItem value="TP">حد سود (TP)</MenuItem>
                                        <MenuItem value="SL">حد ضرر (SL)</MenuItem>
                                        <MenuItem value="BE">سر به سر (BE)</MenuItem>
                                        <MenuItem value="Manual Close">بستن دستی</MenuItem>
                                    </Select>
                                )} />
                            </FormControl>
                            <Controller name="chartLinks" control={control} render={({ field }) => <TextField {...field} label="لینک چارت (با کاما جدا کنید)" fullWidth margin="normal" />} />
                        </Grid>



                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Grid item xs={12}><Typography variant="subtitle1" mt={2}>بازبینی اولیه</Typography></Grid>
                            <ChecklistFields control={control} />

                        </div>

                        <div style={{ width: "15%" }}>

                            <Grid item xs={12}>
                                <Controller
                                    name="tags"
                                    control={control}
                                    defaultValue={[]}
                                    render={({ field: { onChange, value } }) => (
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            options={autocompleteOptions.tags} // <-- Use fetched tags
                                            value={value || []}
                                            onChange={(event, newValue) => {
                                                onChange(newValue);
                                            }}
                                            renderTags={(tagValue, getTagProps) =>
                                                tagValue.map((option, index) => {
                                                    // ۱. استخراج key از بقیه props
                                                    const { key, ...chipProps } = getTagProps({ index });
                                                    // ۲. ارسال مستقیم key به Chip و spread کردن بقیه props
                                                    return <Chip key={key} variant="outlined" label={option} {...chipProps} />;
                                                })
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="برچسب‌ها"
                                                    placeholder="افزودن برچسب..."
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>
                        </div>

                    </Grid>
                    <Grid item xs={12} mt={2}>
                        <Button type="submit" variant="contained" color="primary" fullWidth>
                            {isEditMode ? 'ذخیره تغییرات' : 'ثبت معامله'}
                        </Button>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
}

