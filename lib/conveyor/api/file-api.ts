import { ConveyorApi } from '@/lib/preload/shared'

export class FileApi extends ConveyorApi {
  // نام متد برای خوانایی بیشتر تغییر کرد
  readTradesFromDb = () => this.invoke('db-read-trades')
}