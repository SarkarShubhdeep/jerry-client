import { config as loadEnv } from 'dotenv'
import { app, BrowserWindow, protocol } from 'electron'
import path from 'path'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])
import { registerAwIpc } from './ipc/aw'
import { registerLlmIpc } from './ipc/llm'
import { registerSettingsIpc } from './ipc/settings'
import { migrateEnvApiKeyOnce } from './store/settings'

// Optional dev overrides (e.g. ACTIVITYWATCH_BASE_URL). LLM keys are set in-app only.
loadEnv({ path: path.join(__dirname, '..', '.env') })
const isDev = !app.isPackaged

function registerAppUrlScheme(): void {
  protocol.registerFileProtocol('app', (request, callback) => {
    try {
      const url = new URL(request.url)
      let pathname = decodeURIComponent(url.pathname)
      if (pathname === '/' || pathname === '') {
        pathname = '/index.html'
      }
      const filePath = path.normalize(path.join(app.getAppPath(), 'out', pathname))
      callback({ path: filePath })
    } catch (err) {
      console.error('app:// protocol error', request.url, err)
      callback({ error: -2 })
    }
  })
}

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
    mainWindow.loadURL('app://./index.html')
  }
}

app.whenReady().then(() => {
  if (!isDev) {
    registerAppUrlScheme()
  }
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
