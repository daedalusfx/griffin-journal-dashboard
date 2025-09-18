import { create } from "zustand";

// --- ZUSTAND STORE ---
const initialTrades = [
    { id: 1, symbol: 'BTC/USD', type: 'Buy', entryDate: new Date('2025-09-14T10:30:00'), exitDate: new Date('2025-09-14T14:45:00'), volume: 0.05, pnl: 350.25, strategy: 'Breakout' },
    { id: 2, symbol: 'XAU/USD', type: 'Sell', entryDate: new Date('2025-09-15T08:15:00'), exitDate: new Date('2025-09-15T09:00:00'), volume: 1.20, pnl: -95.50, strategy: 'Scalp' },
    { id: 3, symbol: 'ETH/USD', type: 'Buy', entryDate: new Date('2025-09-15T11:00:00'), exitDate: new Date('2025-09-16T18:00:00'), volume: 0.50, pnl: 812.00, strategy: 'Swing' },
    { id: 4, symbol: 'EUR/JPY', type: 'Sell', entryDate: new Date('2025-09-17T20:05:00'), exitDate: new Date('2025-09-17T22:10:00'), volume: 2.50, pnl: 45.70, strategy: 'Scalp' },
    { id: 5, symbol: 'BTC/USD', type: 'Sell', entryDate: new Date('2025-09-18T15:00:00'), exitDate: new Date('2025-09-18T15:15:00'), volume: 0.10, pnl: -220.00, strategy: 'Breakout' },
];

 const useTradeStore = create((set) => ({
    trades: initialTrades,
    addTrade: (trade) => set((state) => ({
        trades: [...state.trades, { ...trade, id: Date.now(), entryDate: new Date(), exitDate: new Date() }]
    })),
    deleteTrade: (id) => set((state) => ({
        trades: state.trades.filter((trade) => trade.id !== id)
    })),
    // تابع جدید برای وارد کردن چندین معامله
    importTrades: (newTrades) => set(state => ({
        trades: [...state.trades, ...newTrades]
    }))
}));

export { useTradeStore };
