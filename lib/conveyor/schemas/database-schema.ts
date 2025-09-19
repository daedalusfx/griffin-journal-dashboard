import { z } from 'zod';

// این schema کامل و نهایی است
const tradeSchema = z.object({
    id: z.number().optional(),
    symbol: z.string(),
    type: z.string(),
    volume: z.number(),
    pnl: z.number(),
    entryDate: z.string(), // تاریخ‌ها همیشه به صورت رشته ارسال می‌شوند
    exitDate: z.string(),
    strategy: z.string().optional().nullable(),
    commission: z.number().optional().nullable(),
    swap: z.number().optional().nullable(),
    entryPrice: z.number().optional().nullable(),
    exitPrice: z.number().optional().nullable(),
    checklist: z.object({
        emotion: z.string(),
        executionScore: z.number(),
        notes: z.string().optional(),
    }).nullable().optional(),
    tags: z.array(z.string()).optional().nullable(),
    attachments: z.array(z.string()).optional().nullable(),
    // --- فیلدهای جدید و نهایی ---
    riskRewardRatio: z.string().optional().nullable(),
    timeframe: z.string().optional().nullable(),
    accountType: z.string().optional().nullable(),
    outcome: z.string().optional().nullable(),
    chartLinks: z.array(z.string()).optional().nullable(),
});

const dailyLogSchema = z.object({
    date: z.string(),
    pre_market_focus: z.number(),
    pre_market_preparation: z.number(),
    mindfulness_state: z.string(),
    adherence_to_rules: z.number(),
    impulsive_trades_count: z.number(),
    hesitation_on_entry: z.number(),
    premature_exit_count: z.number(),
    post_market_review_quality: z.number(),
    emotional_state_after: z.string(),
    daily_lesson_learned: z.string(),
});


export const databaseIpcSchema = {
  'db-load-trades': {
    args: z.tuple([]),
    return: z.array(tradeSchema),
  },
  'db-add-trade': {
    args: z.tuple([tradeSchema]),
    return: tradeSchema,
  },
  'db-delete-trade': {
    args: z.tuple([z.number()]),
    return: z.void(),
  },
  'db-update-trade-review': {
    args: z.tuple([z.number(), z.any(), z.array(z.string()), z.string()]), 
    return: z.void(),
  },
  'db-bulk-add-trades': {
    args: z.tuple([z.array(tradeSchema)]),
    return: z.array(tradeSchema),
  },
  'db-add-attachment': {
    args: z.tuple([z.number(), z.string()]),
    return: z.void(),
  },
  'db-update-trade': {
    args: z.tuple([tradeSchema]),
    return: tradeSchema,
  },
  'db-save-daily-log': {
    args: z.tuple([dailyLogSchema]),
    return: z.void(),
  },
  'db-get-unique-field-values': {
    args: z.tuple([z.string()]), // ورودی: نام فیلد (e.g., 'strategy')
    return: z.array(z.string()),   // خروجی: آرایه‌ای از مقادیر منحصر به فرد
  },
  'db-get-unique-tags': {
    args: z.tuple([]), // ورودی ندارد
    return: z.array(z.string()), // خروجی: آرایه‌ای از تمام برچسب‌های منحصر به فرد
  },
}
