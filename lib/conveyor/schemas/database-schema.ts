import { z } from 'zod';

// این schema ساختار داده یک معامله را برای اعتبارسنجی تعریف می‌کند
const tradeSchema = z.object({
    id: z.number().optional(),
    symbol: z.string(),
    type: z.string(),
    volume: z.number(),
    pnl: z.number(),
    entryDate: z.string(), // FIX: باید رشته باشد
    exitDate: z.string(),  // FIX: باید رشته باشد
    strategy: z.string().optional(),
    commission: z.number().optional(),
    swap: z.number().optional(),
    entryPrice: z.number().optional(),
    exitPrice: z.number().optional(),
    checklist: z.object({
        emotion: z.string(),
        executionScore: z.number(),
        notes: z.string().optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
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
    args: z.tuple([z.number(), z.any(), z.array(z.string())]),
    return: z.void(),
  },
  'db-bulk-add-trades': {
    args: z.tuple([z.array(tradeSchema)]),
    return: z.array(tradeSchema),
  },
}
