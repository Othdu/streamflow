import { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage, net } from 'electron'
import path from 'path'
import http from 'http'
import fs from 'fs'
import type { Readable } from 'stream'
import { execFile } from 'child_process'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

// Enable hardware H.265/HEVC decoding -- most IPTV streams use HEVC
// Requires Windows HEVC Video Extension (free from Microsoft Store)
app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport')
// Also enable hardware video decoder acceleration
app.commandLine.appendSwitch('enable-accelerated-video-decode')
app.commandLine.appendSwitch('enable-gpu-rasterization')
// Disable throttling so live streams don't get paused in background
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-renderer-backgrounding')

const store = new Store()
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// ── Local stream proxy server ─────────────────────────────────
let proxyServer: http.Server | null = null
let proxyPort = 0

function startProxyServer() {
  proxyServer = http.createServer((req, res) => {
    // Handle CORS preflight for Range requests (seeking)
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range',
        'Access-Control-Max-Age': '86400',
      })
      res.end()
      return
    }

    const parsed = new URL(req.url ?? '/', `http://127.0.0.1`)
    const targetUrl = parsed.searchParams.get('url')

    if (!targetUrl) {
      res.writeHead(400)
      res.end('Missing url param')
      return
    }

    const decoded = decodeURIComponent(targetUrl)
    console.log(`[Proxy] → ${decoded}`)

    const netReq = net.request({
      url: decoded,
      method: 'GET',
      // useSessionCookies ensures cookies are shared if the server uses them
      useSessionCookies: true,
    })

    // Forward Range header for seeking in VOD content
    const rangeHeader = req.headers['range'] as string | undefined

    try {
      const origin = new URL(decoded).origin
      netReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')
      netReq.setHeader('Accept', '*/*')
      netReq.setHeader('Accept-Language', 'en-US,en;q=0.9')
      netReq.setHeader('Referer', origin + '/')
      netReq.setHeader('Connection', 'keep-alive')
      if (rangeHeader) {
        netReq.setHeader('Range', rangeHeader)
      }
    } catch {}

    netReq.on('response', (netRes) => {
      const serverCt = (netRes.headers['content-type'] as string) || ''
      const isManifest = decoded.includes('.m3u8')
      const statusCode = netRes.statusCode ?? 200
      console.log(`[Proxy] ${statusCode} ← ${decoded.slice(0, 80)}`)

      if (isManifest) {
        // Collect the full manifest body, then rewrite relative URLs
        // so hls.js fetches every segment through this proxy
        const chunks: Buffer[] = []
        netRes.on('data', (chunk: Buffer) => chunks.push(chunk))
        netRes.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          const baseUrl = new URL(decoded)

          const rewritten = body.split('\n').map(line => {
            const t = line.trim()
            if (!t || t.startsWith('#')) return line   // keep comment/tag lines as-is

            // Resolve to absolute URL
            let absolute: string
            if (t.startsWith('http://') || t.startsWith('https://')) {
              absolute = t
            } else {
              try { absolute = new URL(t, baseUrl).href }
              catch { return line }
            }
            // Route through our proxy
            return `http://127.0.0.1:${proxyPort}/stream?url=${encodeURIComponent(absolute)}`
          }).join('\n')

          console.log(`[Proxy] Manifest rewritten, ${chunks.length} chunks`)
          if (!res.headersSent) {
            res.writeHead(statusCode, {
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache',
            })
          }
          res.end(rewritten)
        })
        netRes.on('error', () => { if (!res.writableEnded) res.end() })
      } else {
        // Binary stream (segments, VOD files) — pipe directly
        const ct = serverCt || 'video/mp2t'
        const responseHeaders: Record<string, string> = {
          'Content-Type': ct,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Range',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Accept-Ranges': 'bytes',
        }
        // Forward Range-related headers from upstream for seeking
        const contentRange = netRes.headers['content-range'] as string
        const contentLength = netRes.headers['content-length'] as string
        if (contentRange) responseHeaders['Content-Range'] = contentRange
        if (contentLength) responseHeaders['Content-Length'] = contentLength

        if (!res.headersSent) {
          res.writeHead(statusCode, responseHeaders)
        }
        netRes.on('data', (chunk: Buffer) => {
          if (!res.writableEnded && res.writable) {
            try { res.write(chunk) } catch {}
          }
        })
        netRes.on('end', () => { if (!res.writableEnded) res.end() })
        netRes.on('error', () => { if (!res.writableEnded) res.end() })
      }
    })

    netReq.on('error', (err) => {
      console.error('[Proxy] net.request error:', err.message)
      if (!res.headersSent) res.writeHead(502)
      if (!res.writableEnded) res.end(`Proxy error: ${err.message}`)
    })

    req.on('close', () => {
      try { netReq.abort() } catch {}
    })

    netReq.end()
  })

  proxyServer.listen(0, '127.0.0.1', () => {
    const addr = proxyServer!.address() as { port: number }
    proxyPort = addr.port
    console.log(`[Proxy] Listening on port ${proxyPort}`)
  })
}

// ── Window ────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0B0E15',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  const startMinimized = store.get('settings.startMinimized') as boolean | undefined
  if (startMinimized) {
    mainWindow.hide()
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (e) => {
    const minimizeToTray = store.get('settings.minimizeToTray') as boolean | undefined
    if (minimizeToTray && mainWindow && !(app as any).isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function createTray() {
  const iconPath = path.join(__dirname, isDev ? '../public/favicon.svg' : '../dist/favicon.svg')
  let trayIcon: Electron.NativeImage
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  } catch {
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('StreamFlow')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show StreamFlow',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus() }
        else createWindow()
      },
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { (app as any).isQuitting = true; app.quit() } },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus() }
  })
}

// ── IPC handlers ──────────────────────────────────────────────
ipcMain.handle('store:get', (_e, key) => store.get(key))
ipcMain.handle('store:set', (_e, key, value) => store.set(key, value))
ipcMain.handle('store:delete', (_e, key) => store.delete(key))

ipcMain.on('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
ipcMain.on('window:maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  win?.isMaximized() ? win.unmaximize() : win?.maximize()
})
ipcMain.on('window:close', () => BrowserWindow.getFocusedWindow()?.close())

// Proxy: return localhost URL for a given stream URL
ipcMain.handle('proxy:url', (_e, streamUrl: string) => {
  return `http://127.0.0.1:${proxyPort}/stream?url=${encodeURIComponent(streamUrl)}`
})

// External player launch
ipcMain.handle('player:launch-external', async (_e, url: string, playerPath?: string) => {
  const exe = playerPath || (store.get('settings.externalPlayerPath') as string | undefined)
  if (!exe) return { success: false, error: 'No external player configured. Set the path in Settings > Player.' }
  try {
    execFile(exe, [url])
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('dialog:open-file', async (_e, options: Electron.OpenDialogOptions) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return { canceled: true, filePaths: [] }
  return dialog.showOpenDialog(win, options)
})

/** One active VOD download per renderer (cancel replaces previous registration). */
const activeVodDownloadAbort = new Map<number, () => void>()

ipcMain.handle('vod:download-cancel', (event) => {
  activeVodDownloadAbort.get(event.sender.id)?.()
  return { ok: true }
})

/** Save a single-file VOD URL to disk (not HLS). */
ipcMain.handle(
  'vod:download',
  async (event, payload: { url: string; defaultFilename: string }) => {
    const cleanUrl = payload.url.replace(/#resume=[\d.]+$/, '')
    if (cleanUrl.toLowerCase().includes('.m3u8')) {
      return { ok: false, error: 'HLS playlists cannot be downloaded as a single file.' }
    }
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow()
    if (!win) return { ok: false, error: 'No window' }

    const safeName = payload.defaultFilename.replace(/[/\\?%*:|"<>]/g, '_') || 'video.mp4'
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: safeName,
      filters: [
        { name: 'Video', extensions: ['mp4', 'mkv', 'ts', 'm4v', 'avi', 'mpeg'] },
        { name: 'All files', extensions: ['*'] },
      ],
    })
    if (canceled || !filePath) return { ok: false, canceled: true }

    const senderId = event.sender.id

    return await new Promise<{ ok: boolean; path?: string; error?: string; canceled?: boolean }>(
      (resolve) => {
        let settled = false
        let received = 0
        let total = 0
        let lastProgressAt = 0
        let file: fs.WriteStream | null = null
        let netReq: Electron.ClientRequest | null = null
        let downloadReadable: Readable | null = null

        const sendProgress = () => {
          if (settled) return
          const now = Date.now()
          if (now - lastProgressAt < 200 && total > 0 && received < total) return
          lastProgressAt = now
          if (!win.isDestroyed()) {
            win.webContents.send('vod:download-progress', { received, total })
          }
        }

        const clearActive = () => {
          activeVodDownloadAbort.delete(senderId)
        }

        const cleanupPartialFile = () => {
          try {
            file?.close()
          } catch {}
          file = null
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
          } catch {}
        }

        const finish = (result: { ok: boolean; path?: string; error?: string; canceled?: boolean }) => {
          if (settled) return
          settled = true
          clearActive()
          resolve(result)
        }

        const fail = (error: string) => {
          cleanupPartialFile()
          finish({ ok: false, error })
        }

        /** Hard-stop: must run before any async resume (e.g. file 'drain' → readable.resume). */
        const abortByUser = () => {
          if (settled) return
          settled = true
          clearActive()

          try {
            netReq?.abort()
          } catch {}
          netReq = null

          const r = downloadReadable as (Readable & { destroy?: (err?: Error) => void }) | null
          downloadReadable = null
          if (r) {
            try {
              r.removeAllListeners?.()
            } catch {}
            try {
              r.destroy?.()
            } catch {}
          }

          const ws = file
          file = null
          if (ws) {
            try {
              ws.removeAllListeners?.('drain')
              ws.removeAllListeners?.('error')
            } catch {}
            try {
              ;(ws as fs.WriteStream & { destroy?: (err?: Error) => void }).destroy?.()
            } catch {}
            try {
              ws.close()
            } catch {}
          }

          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
          } catch {}

          resolve({ ok: false, canceled: true })
        }

        activeVodDownloadAbort.set(senderId, abortByUser)

        try {
          const parsed = new URL(cleanUrl)
          const origin = parsed.origin
          netReq = net.request({ url: cleanUrl, method: 'GET', useSessionCookies: true })
          netReq.setHeader(
            'User-Agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          )
          netReq.setHeader('Accept', '*/*')
          netReq.setHeader('Accept-Language', 'en-US,en;q=0.9')
          netReq.setHeader('Referer', `${origin}/`)
          netReq.setHeader('Connection', 'keep-alive')

          netReq.on('response', (res) => {
            const settleFail = (msg: string) => {
              if (settled) return
              fail(msg)
            }
            const settleOk = () => {
              if (settled) return
              settled = true
              clearActive()
              if (!win.isDestroyed()) {
                win.webContents.send('vod:download-progress', {
                  received,
                  total: total || received,
                })
              }
              resolve({ ok: true, path: filePath })
            }

            const code = res.statusCode ?? 0
            if (code >= 400) {
              settleFail(`HTTP ${code}`)
              return
            }
            const cl = res.headers['content-length']
            total = cl ? parseInt(String(cl), 10) || 0 : 0
            file = fs.createWriteStream(filePath)

            const readable = res as unknown as Readable
            downloadReadable = readable
            res.on('data', (chunk: Buffer) => {
              if (settled) return
              received += chunk.length
              if (file && !file.write(chunk)) {
                readable.pause()
                file.once('drain', () => {
                  if (settled) return
                  try {
                    readable.resume()
                  } catch {}
                })
              }
              sendProgress()
            })
            res.on('end', () => {
              if (settled) return
              if (!file) {
                settleFail('Download incomplete')
                return
              }
              const ws = file
              file = null
              ws.end(() => settleOk())
            })
            res.on('error', (e) => settleFail(e.message))
          })
          netReq.on('error', () => {
            if (settled) return
            fail('Download failed')
          })
          netReq.end()
        } catch (e: any) {
          fail(e?.message || 'Invalid URL')
        }
      },
    )
  },
)

ipcMain.handle('app:version', () => app.getVersion())

// Auto-updater
function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update:available', info.version)
  })
  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update:downloaded')
  })

  autoUpdater.checkForUpdates().catch(() => {})
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000)
}

ipcMain.handle('update:check', async () => {
  try {
    const result = await autoUpdater.checkForUpdates()
    return { available: !!result?.updateInfo, version: result?.updateInfo?.version }
  } catch {
    return { available: false }
  }
})
ipcMain.handle('update:download', async () => {
  try { await autoUpdater.downloadUpdate(); return { success: true } }
  catch (err: any) { return { success: false, error: err.message } }
})
ipcMain.on('update:install', () => {
  (app as any).isQuitting = true
  autoUpdater.quitAndInstall()
})

// ── App lifecycle ─────────────────────────────────────────────
app.whenReady().then(() => {
  startProxyServer()
  createWindow()
  createTray()
  if (!isDev) setupAutoUpdater()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    const minimizeToTray = store.get('settings.minimizeToTray') as boolean | undefined
    if (!minimizeToTray) app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('before-quit', () => {
  (app as any).isQuitting = true
  proxyServer?.close()
})
