
import { z } from 'zod';

const tradeSchema = z.object({
    id: z.number().optional(),
    symbol: z.string(),
    type: z.string(),
    volume: z.number(),
    pnl: z.number(),
    entryDate: z.string(),
    exitDate: z.string(),
    strategy: z.string().optional(),
    commission: z.number().optional(),
    swap: z.number().optional(),
    entryPrice: z.number().optional(),
    exitPrice: z.number().optional(),
    checklist: z.object({
        emotion: z.string(),
        executionScore: z.number(),
        notes: z.string().optional(),
    }).nullable().optional(), // <--- تغییر در این خط
    tags: z.array(z.string()).optional(),
    attachments: z.array(z.string()).optional().nullable(),
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
    args: z.tuple([z.number(), z.string()]), // tradeId, attachmentName
    return: z.void(),
  },
  'db-update-trade': {
    args: z.tuple([tradeSchema]), // یک آبجکت کامل معامله را دریافت می‌کند
    return: tradeSchema,          // معامله آپدیت شده را برمی‌گرداند
  },
}