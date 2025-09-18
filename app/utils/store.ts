import { create } from "zustand";

// تعریف ساختار داده برای چک‌لیست
export interface TradeChecklist {
  emotion: 'آرام' | 'هیجان‌زده' | 'مضطرب' | 'ترس از دست دادن (FOMO)' | 'نامشخص';
  executionScore: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

// تعریف ساختار اصلی معامله
export interface Trade {
  id: number;
  symbol: string;
  type: 'Buy' | 'Sell' | string;
  volume: number;
  pnl: number;
  entryDate: Date;
  exitDate: Date;
  commission?: number;
  swap?: number;
  entryPrice?: number;
  exitPrice?: number;
  strategy?: string;
  checklist?: TradeChecklist; // فیلد جدید برای چک‌لیست
}


const initialTrades: Trade[] = [
    { id: 1, symbol: 'BTC/USD', type: 'Buy', entryDate: new Date('2025-09-14T10:30:00'), exitDate: new Date('2025-09-14T14:45:00'), volume: 0.05, pnl: 350.25, strategy: 'Breakout' },
    { id: 2, symbol: 'XAU/USD', type: 'Sell', entryDate: new Date('2025-09-15T08:15:00'), exitDate: new Date('2025-09-15T09:00:00'), volume: 1.20, pnl: -95.50, strategy: 'Scalp' },
    { id: 3, symbol: 'ETH/USD', type: 'Buy', entryDate: new Date('2025-09-15T11:00:00'), exitDate: new Date('2025-09-16T18:00:00'), volume: 0.50, pnl: 812.00, strategy: 'Swing' },
];

 const useTradeStore = create<{
    trades: Trade[];
    addTrade: (trade: Omit<Trade, 'id' | 'entryDate' | 'exitDate'>) => void;
    deleteTrade: (id: number) => void;
    importTrades: (newTrades: Trade[]) => void;
    updateTradeChecklist: (id: number, checklist: TradeChecklist) => void; // تابع جدید
 }>((set) => ({
    trades: initialTrades,
    addTrade: (trade) => set((state) => ({
        trades: [...state.trades, { ...trade, id: Date.now(), entryDate: new Date(), exitDate: new Date() }]
    })),
    deleteTrade: (id) => set((state) => ({
        trades: state.trades.filter((trade) => trade.id !== id)
    })),
    importTrades: (newTrades) => set(state => ({
        trades: [...state.trades, ...newTrades]
    })),
    // منطق تابع جدید برای به‌روزرسانی چک‌لیست یک معامله خاص
    updateTradeChecklist: (id, checklist) => set(state => ({
        trades: state.trades.map(trade => 
            trade.id === id ? { ...trade, checklist } : trade
        )
    }))
}));

export { useTradeStore };

