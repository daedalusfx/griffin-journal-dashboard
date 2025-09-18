// src/renderer/types.ts

export interface Trade {
    ticket: number;
    symbol: string;
    type: string;
    volume: number;
    profit: number;
    atm_enabled: boolean;
    is_breakeven: boolean;
    progress_percent: number;
    is_breakeven_possible: boolean; 
    was_rule_applied: boolean;
  }
  
  export interface CommandPayload {
    action: string;
    [key: string]: any;
  }
  
  export interface Settings {
    triggerPercent?: number;
    moveToBE?: boolean;
    closePercent?: number;
  }