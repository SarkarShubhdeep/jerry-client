import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerAwIpc } from './ipc/aw'

const isDev = !app.isPackaged

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'))
  }
}

app.whenReady().then(() => {
  registerAwIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
