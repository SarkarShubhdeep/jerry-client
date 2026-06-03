import { config as loadEnv } from 'dotenv'
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerAwIpc } from './ipc/aw'
import { registerLlmIpc } from './ipc/llm'
import { registerSettingsIpc } from './ipc/settings'
import { migrateEnvApiKeyOnce } from './store/settings'

// Optional dev overrides (e.g. ACTIVITYWATCH_BASE_URL). LLM keys are set in-app only.
loadEnv({ path: path.join(__dirname, '..', '.env') })
const isDev = !app.isPackaged

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    show: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 10 },
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
  migrateEnvApiKeyOnce()
  registerAwIpc()
  registerLlmIpc()
  registerSettingsIpc()
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
