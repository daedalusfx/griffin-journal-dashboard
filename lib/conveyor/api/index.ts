import { electronAPI } from '@electron-toolkit/preload'
import { AppApi } from './app-api'
import { FileApi } from './file-api'
import { WindowApi } from './window-api'


export const conveyor = {
  app: new AppApi(electronAPI),
  window: new WindowApi(electronAPI),
  file: new FileApi(electronAPI), 
}

export type ConveyorApi = typeof conveyor
