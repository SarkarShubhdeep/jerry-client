import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('jerry', {
  ping: (): string => 'pong',
  getVersion: (): string => process.versions.electron,
})
