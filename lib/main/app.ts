import { registerAppHandlers } from '@/lib/conveyor/handlers/app-handler';
import { closeDatabase, registerDatabaseHandlers } from '@/lib/conveyor/handlers/database-handler';
import { registerFileHandlers } from '@/lib/conveyor/handlers/file-handler';
import { registerWindowHandlers } from '@/lib/conveyor/handlers/window-handler';
import appIcon from '@/resources/build/icon.png?asset';
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { registerResourcesProtocol } from './protocols';

export function createAppWindow(): void {
  // Register custom protocol for resources
  registerResourcesProtocol()

  // Create the main window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    backgroundColor: '#1c1c1c',
    icon: appIcon,
    frame: true,
    titleBarStyle: 'hiddenInset',
    title: 'Electron React App',
    resizable: true,   
    maximizable: true,  
    minimizable: true,  
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
    },
  })

  // Register IPC events for the main window.
  registerWindowHandlers(mainWindow)
  registerAppHandlers(app)
  registerFileHandlers() 
  registerDatabaseHandlers(); 

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.on('before-quit', () => {
  closeDatabase();
});
