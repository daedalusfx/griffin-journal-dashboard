import { electronAPI } from '@electron-toolkit/preload'
import { AppApi } from './app-api'
import { DatabaseApi } from './database-api'
import { FileApi } from './file-api'
import { WindowApi } from './window-api'

export const conveyor = {
  app: new AppApi(electronAPI),
  window: new WindowApi(electronAPI),
  file: new FileApi(electronAPI), 
  database: new DatabaseApi(electronAPI),
}

export type ConveyorApi = typeof conveyor
