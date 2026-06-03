export interface JerryAPI {
  ping: () => string
  getVersion: () => string
}

declare global {
  interface Window {
    jerry: JerryAPI
  }
}

export {}
