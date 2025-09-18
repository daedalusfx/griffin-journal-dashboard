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
  checklist?: TradeChecklist; 
  tags?: string[];
}


 const useTradeStore = create<{
    trades: Trade[];
    setTrades: (trades: Trade[]) => void; 
    addTrade: (trade: Trade) => void; // <-- تغییر تایپ ورودی
    deleteTrade: (id: number) => void;
    importTrades: (newTrades: Trade[]) => void;
    updateTradeChecklist: (id: number, checklist: TradeChecklist) => void;
    updateTradeTags: (id: number, tags: string[]) => void; 
    updateTradeStrategy: (id: number, strategy: string) => void;
}>((set) => ({
    trades: [],
    setTrades: (trades) => set({ trades: trades.map(t => ({...t, entryDate: new Date(t.entryDate), exitDate: new Date(t.exitDate)})) }),
    // FIX: حالا معامله‌ای که از دیتابیس می‌آید را مستقیم اضافه می‌کند
    addTrade: (trade) => set((state) => ({
        trades: [trade, ...state.trades]
    })),
    deleteTrade: (id) => set((state) => ({
        trades: state.trades.filter((trade) => trade.id !== id)
    })),
    // FIX: معاملات وارداتی هم باید تاریخ‌هایشان تبدیل شود
    importTrades: (newTrades) => set(state => ({
        trades: [...newTrades.map(t => ({...t, entryDate: new Date(t.entryDate), exitDate: new Date(t.exitDate)})), ...state.trades]
    })),
    updateTradeChecklist: (id, checklist) => set(state => ({
        trades: state.trades.map(trade => 
            trade.id === id ? { ...trade, checklist } : trade
        )
    })),
    updateTradeTags: (id, tags) => set(state => ({
        trades: state.trades.map(trade => 
            trade.id === id ? { ...trade, tags } : trade
        )
    })),
    updateTradeStrategy: (id, strategy) => set(state => ({
        trades: state.trades.map(trade => 
            trade.id === id ? { ...trade, strategy } : trade
        )
    }))
}));

export { useTradeStore };

