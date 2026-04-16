// Thin wrapper — calls Electron's main process store via the preload bridge.
// Falls back to localStorage when running in browser (dev without Electron).

const isElectron = typeof window !== 'undefined' && 'electron' in window

export const persistentStore = {
  async get<T>(key: string): Promise<T | null> {
    if (isElectron) {
      return (window as any).electron.store.get(key) as T | null
    }
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  },

  async set<T>(key: string, value: T): Promise<void> {
    if (isElectron) {
      await (window as any).electron.store.set(key, value)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  },

  async delete(key: string): Promise<void> {
    if (isElectron) {
      await (window as any).electron.store.delete(key)
    } else {
      localStorage.removeItem(key)
    }
  },
}
