import { z } from 'zod'

// تعریف ساختار یک معامله که از دیتابیس خوانده می‌شود
const tradeSchema = z.object({
  id: z.number(),
  symbol: z.string(),
  type: z.string(),
  volume: z.number(),
  pnl: z.number(),
  entryDate: z.date(),
  exitDate: z.date(),
  commission: z.number(),
  swap: z.number(),
  entryPrice: z.number(),
  exitPrice: z.number(),
})

export const fileIpcSchema = {
  // نام کانال به چیزی مرتبط‌تر تغییر کرد
  'db-read-trades': {
    args: z.tuple([]),
    // در پاسخ، آرایه‌ای از معاملات یا null برمی‌گرداند
    return: z.array(tradeSchema).nullable(),
  },
}

