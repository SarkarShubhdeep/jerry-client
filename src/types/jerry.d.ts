import type { AwActivitySummary, IpcResult } from './activitywatch'

export interface JerryAPI {
  ping: () => string
  getVersion: () => string
  aw: {
    fetchActivity: (rangeHours: number) => Promise<IpcResult<AwActivitySummary>>
  }
}

declare global {
  interface Window {
    jerry?: JerryAPI
  }
}

export {}
