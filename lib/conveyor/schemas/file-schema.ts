import { z } from 'zod'

// تعریف ساختار یک معامله که از دیتابیس متاتریدر خوانده می‌شود
const tradeSchema = z.object({
  id: z.number(),
  symbol: z.string(),
  type: z.string(),
  volume: z.number(),
  pnl: z.number(),
  entryDate: z.string(), // FIX: باید رشته باشد
  exitDate: z.string(),  // FIX: باید رشته باشد
  commission: z.number(),
  swap: z.number(),
  entryPrice: z.number(),
  exitPrice: z.number(),
  strategy: z.string(),
})

export const fileIpcSchema = {
  'db-read-trades': {
    args: z.tuple([]),
    // در پاسخ، آرایه‌ای از معاملات یا null برمی‌گرداند
    return: z.array(tradeSchema).nullable(),
  },
}

