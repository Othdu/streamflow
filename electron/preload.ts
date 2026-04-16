import { contextBridge, ipcRenderer, shell } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  shell: {
    openExternal: (url: string) => shell.openExternal(url),
  },
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
  proxy: {
    getUrl: (streamUrl: string) => ipcRenderer.invoke('proxy:url', streamUrl),
  },
  player: {
    launchExternal: (url: string, playerPath?: string) =>
      ipcRenderer.invoke('player:launch-external', url, playerPath),
  },
  dialog: {
    openFile: (options: any) => ipcRenderer.invoke('dialog:open-file', options),
  },
  updater: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.send('update:install'),
    onAvailable: (cb: (version: string) => void) => {
      ipcRenderer.on('update:available', (_e, version) => cb(version))
    },
    onDownloaded: (cb: () => void) => {
      ipcRenderer.on('update:downloaded', () => cb())
    },
  },
  getVersion: () => ipcRenderer.invoke('app:version'),
})
