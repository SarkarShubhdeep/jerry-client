import { contextBridge, ipcRenderer } from 'electron'
import type { AwActivitySummary } from './aw/types'
import type { IpcResult } from './ipc/aw'

contextBridge.exposeInMainWorld('jerry', {
  ping: (): string => 'pong',
  getVersion: (): string => process.versions.electron,
  aw: {
    fetchActivity: (rangeHours: number): Promise<IpcResult<AwActivitySummary>> =>
      ipcRenderer.invoke('jerry:aw:fetchActivity', { rangeHours }),
  },
})
