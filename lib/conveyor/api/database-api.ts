import type { Trade, TradeChecklist } from '@/app/utils/store'
import { ConveyorApi } from '@/lib/preload/shared'

export class DatabaseApi extends ConveyorApi {
  loadTrades = () => this.invoke('db-load-trades')
  addTrade = (trade: Omit<Trade, 'id'>) => this.invoke('db-add-trade', trade as any)
  updateTrade = (trade: Trade) => this.invoke('db-update-trade', trade as any)
  deleteTrade = (id: number) => this.invoke('db-delete-trade', id)
updateTradeReview = (id: number, checklist: TradeChecklist, tags: string[], strategy: string) => 
this.invoke('db-update-trade-review', id, checklist, tags, strategy)

  bulkAddTrades = (trades: Trade[]) => this.invoke('db-bulk-add-trades', trades)
  addAttachment = (tradeId: number, attachmentName: string) => this.invoke('db-add-attachment', tradeId, attachmentName)
  saveDailyLog = (logData: any) => this.invoke('db-save-daily-log', logData);
  getUniqueFieldValues = (fieldName: string): Promise<string[]> => this.invoke('db-get-unique-field-values', fieldName);
  getUniqueTags = (): Promise<string[]> => this.invoke('db-get-unique-tags');

}
