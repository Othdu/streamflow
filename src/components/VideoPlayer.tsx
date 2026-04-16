import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import mpegts from 'mpegts.js'
import { useAppStore } from '@/store'
import MiniChannelStrip from './MiniChannelStrip'
import QualitySelector from './QualitySelector'

// Ask the Electron main process for a localhost proxy URL for the given stream
async function getProxyUrl(url: string): Promise<string> {
  const electron = (window as any).electron
  if (electron?.proxy?.getUrl) {
    return electron.proxy.getUrl(url)
  }
  return url // fallback: use directly (dev browser mode)
}

export default function VideoPlayer() {
  const streamUrl = useAppStore(s => s.player.streamUrl)
  const channelName = useAppStore(s => s.player.channelName)
  const channelLogo = useAppStore(s => s.player.channelLogo)
  const isPlaying = useAppStore(s => s.player.isPlaying)
  const volume = useAppStore(s => s.player.volume)
  const stopStream = useAppStore(s => s.stopStream)
  const setVolume = useAppStore(s => s.setVolume)
  const setFullscreen = useAppStore(s => s.setFullscreen)
  const activeTab = useAppStore(s => s.activeTab)
  const settings = useAppStore(s => s.settings)
  const addToHistory = useAppStore(s => s.addToHistory)
  const watchHistory = useAppStore(s => s.watchHistory)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const mpegtsRef = useRef<mpegts.Player | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showStrip, setShowStrip] = useState(false)
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null)
  const [status, setStatus] = useState('')
  const [codecInfo, setCodecInfo] = useState<string>('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const seekBarRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()
  const cleanupRef = useRef<(() => void) | null>(null)
  const rafRef = useRef<number>(0)
  const [showTracks, setShowTracks] = useState(false)
  const [audioTracks, setAudioTracks] = useState<{ id: number; label: string; language: string; enabled: boolean }[]>([])
  const [textTracks, setTextTracks] = useState<{ index: number; label: string; language: string; mode: string }[]>([])

  const isVod = streamUrl ? !streamUrl.includes('/live/') : false

  // Time tracking via requestAnimationFrame for smooth updates
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const update = () => {
      if (!seeking) {
        setCurrentTime(vid.currentTime || 0)
        setDuration(vid.duration || 0)
        if (vid.buffered.length > 0) {
          setBuffered(vid.buffered.end(vid.buffered.length - 1))
        }
      }
      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [seeking])

  const formatTime = useCallback((s: number) => {
    if (!isFinite(s) || s < 0) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekBarRef.current
    const vid = videoRef.current
    if (!bar || !vid || !isFinite(vid.duration)) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    vid.currentTime = pct * vid.duration
    setCurrentTime(pct * vid.duration)
  }, [])

  const handleSeekDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return
    handleSeek(e)
  }, [handleSeek])

  const destroyPlayers = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
      setHlsInstance(null)
    }
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.pause()
        mpegtsRef.current.unload()
        mpegtsRef.current.detachMediaElement()
        mpegtsRef.current.destroy()
      } catch {}
      mpegtsRef.current = null
    }
    const vid = videoRef.current
    if (vid) {
      vid.removeAttribute('src')
      vid.load()
    }
  }, [])

  // Try HLS via hls.js (for .m3u8 streams)
  const tryHls = useCallback((proxyUrl: string, onFail: (reason: string) => void) => {
    const vid = videoRef.current
    if (!vid || !Hls.isSupported()) { onFail('HLS not supported'); return }

    setStatus('Connecting via HLS...')
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 60,
      maxBufferLength: 60,
      // Generous retries — live streams have occasional bad segments
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 500,
      manifestLoadingMaxRetry: 4,
      manifestLoadingRetryDelay: 500,
      levelLoadingMaxRetry: 4,
      manifestLoadingTimeOut: 15000,
      fragLoadingTimeOut: 20000,
      levelLoadingTimeOut: 15000,
    })
    hlsRef.current = hls
    setHlsInstance(hls)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setStatus('')
      vid.volume = volume / 100
      if (settings.autoPlay) vid.play().catch(() => {})
    })

    let mediaRecoveries = 0
    let networkRecoveries = 0
    const MAX_RECOVERIES = 3

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (!data.fatal) return   // non-fatal: hls.js handles it internally

      console.warn('[HLS fatal]', data.type, data.details, data.response?.code)

      // Standard hls.js recovery pattern
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries < MAX_RECOVERIES) {
        mediaRecoveries++
        console.log(`[HLS] recoverMediaError attempt ${mediaRecoveries}`)
        hls.recoverMediaError()
        return
      }

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRecoveries < MAX_RECOVERIES) {
        networkRecoveries++
        console.log(`[HLS] startLoad retry attempt ${networkRecoveries}`)
        // Brief delay before reconnect so the server isn't immediately hammered
        setTimeout(() => {
          if (hlsRef.current === hls) hls.startLoad()
        }, 1500)
        return
      }

      // Truly unrecoverable after all retries
      hls.destroy()
      hlsRef.current = null
      setHlsInstance(null)
      onFail(`HLS error: ${data.details}`)
    })

    hls.loadSource(proxyUrl)
    hls.attachMedia(vid)
  }, [volume, settings.autoPlay])

  // Try raw MPEG-TS via mpegts.js
  const tryMpegts = useCallback((proxyUrl: string, onFail: (reason: string) => void) => {
    const vid = videoRef.current
    if (!vid || !mpegts.isSupported()) { onFail('MSE not supported'); return }

    setStatus('Connecting via MPEG-TS...')

    const stashSizeMap = { low: 256 * 1024, balanced: 1024 * 1024, smooth: 2 * 1024 * 1024 }
    const stashInitialSize = stashSizeMap[settings.bufferMode] ?? 1024 * 1024

    const player = mpegts.createPlayer(
      { type: 'mpegts', url: proxyUrl, isLive: true },
      {
        enableWorker: true,
        liveBufferLatencyChasing: false,
        liveBufferLatencyMaxLatency: 15,
        liveBufferLatencyMinRemain: 3,
        stashInitialSize,
        enableStashBuffer: true,
      }
    )
    mpegtsRef.current = player

    player.on(mpegts.Events.MEDIA_INFO, (info: any) => {
      const vcodec = info?.videoCodec || ''
      const acodec = info?.audioCodec || ''
      const codec = [vcodec, acodec].filter(Boolean).join(' + ')
      console.log('[mpegts] MEDIA_INFO', info)
      setCodecInfo(codec)
      setStatus('')
      vid.volume = volume / 100
      if (settings.autoPlay) vid.play().catch(() => {})
    })

    let mpegtsRetries = 0
    player.on(mpegts.Events.ERROR, (type: string, detail: string) => {
      console.warn('[mpegts error]', type, detail)
      // Try to reload before giving up
      if (mpegtsRetries < 3 && mpegtsRef.current === player) {
        mpegtsRetries++
        console.log(`[mpegts] Reconnect attempt ${mpegtsRetries}`)
        try { player.unload() } catch {}
        setTimeout(() => {
          if (mpegtsRef.current === player) {
            try { player.load() } catch {}
          }
        }, 1500)
        return
      }
      try { player.unload(); player.detachMediaElement(); player.destroy() } catch {}
      mpegtsRef.current = null
      onFail(`MPEG-TS error: ${type} / ${detail}`)
    })

    player.attachMediaElement(vid)
    player.load()

    // Safety timeout — some streams never fire ERROR but also never play
    const t = setTimeout(() => {
      if (mpegtsRef.current === player) {
        console.warn('[mpegts] timeout waiting for MEDIA_INFO')
        try { player.unload(); player.detachMediaElement(); player.destroy() } catch {}
        mpegtsRef.current = null
        onFail('Timeout waiting for stream data')
      }
    }, 20000)

    cleanupRef.current = () => clearTimeout(t)
  }, [volume, settings.bufferMode, settings.autoPlay])

  // Try native HTML5 (mp4, mkv, etc. — VOD only)
  const tryNative = useCallback((proxyUrl: string, onFail: (reason: string) => void) => {
    const vid = videoRef.current
    if (!vid) return

    setStatus('Loading...')
    vid.src = proxyUrl
    vid.volume = volume / 100

    const onCanPlay = () => {
      cleanup()
      setStatus('')
      if (settings.autoPlay) vid.play().catch(() => {})
    }
    const onError = () => {
      cleanup()
      const code = vid.error?.code ?? 0
      onFail(`Native playback error (code ${code})`)
    }
    function cleanup() {
      vid.removeEventListener('canplay', onCanPlay)
      vid.removeEventListener('error', onError)
    }
    vid.addEventListener('canplay', onCanPlay)
    vid.addEventListener('error', onError)
    vid.load()
  }, [volume, settings.autoPlay])

  // Main entry: proxy URL → try strategies in sequence
  const startPlayback = useCallback(async (originalUrl: string) => {
    destroyPlayers()
    setError(null)
    setPaused(false)

    const isLive = originalUrl.includes('/live/')
    setStatus('Routing through proxy...')

    // Get the proxy URL for the original stream
    // For HLS we proxy the manifest; segments are fetched by hls.js
    const m3u8Url = originalUrl.replace(/\.\w+$/, '.m3u8')
    const tsUrl = originalUrl.replace(/\.\w+$/, '.ts')

    const [proxyM3u8, proxyTs, proxyOrig] = await Promise.all([
      getProxyUrl(m3u8Url),
      getProxyUrl(tsUrl),
      getProxyUrl(originalUrl),
    ])

    console.log('[StreamFlow] Proxy URLs ready')
    console.log('  m3u8:', proxyM3u8)
    console.log('  ts  :', proxyTs)

    if (isLive) {
      const fmt = settings.defaultStreamFormat
      const playMpegtsFirst = () => {
        tryMpegts(proxyTs, (err1) => {
          console.warn('[StreamFlow] MPEG-TS failed:', err1)
          setStatus('MPEG-TS failed, trying HLS...')
          destroyPlayers()
          tryHls(proxyM3u8, (err2) => {
            console.warn('[StreamFlow] HLS failed:', err2)
            setStatus('')
            const hevcHint = (err1 + err2).toLowerCase().includes('codec') || (err1 + err2).toLowerCase().includes('decode')
              ? 'Your stream uses H.265/HEVC. Make sure the Windows HEVC Video Extension is installed (free from Microsoft Store), then restart StreamFlow.'
              : 'Your provider\'s stream could not be decoded. Try an external player like mpv or VLC which support more codecs.'
            setError(`Stream cannot be played in-app.\n\n${hevcHint}`)
          })
        })
      }
      const playHlsFirst = () => {
        tryHls(proxyM3u8, (err1) => {
          console.warn('[StreamFlow] HLS failed:', err1)
          setStatus('HLS failed, trying MPEG-TS...')
          destroyPlayers()
          tryMpegts(proxyTs, (err2) => {
            console.warn('[StreamFlow] MPEG-TS failed:', err2)
            setStatus('')
            const hevcHint = (err1 + err2).toLowerCase().includes('codec') || (err1 + err2).toLowerCase().includes('decode')
              ? 'Your stream uses H.265/HEVC. Make sure the Windows HEVC Video Extension is installed (free from Microsoft Store), then restart StreamFlow.'
              : 'Your provider\'s stream could not be decoded. Try an external player like mpv or VLC which support more codecs.'
            setError(`Stream cannot be played in-app.\n\n${hevcHint}`)
          })
        })
      }

      if (fmt === 'ts') playMpegtsFirst()
      else if (fmt === 'm3u8') playHlsFirst()
      else playMpegtsFirst() // 'auto' defaults to mpegts first
    } else {
      // VOD: try native first, then HLS
      tryNative(proxyOrig, (err1) => {
        console.warn('[StreamFlow] Native failed:', err1)
        setStatus('Trying HLS for VOD...')
        destroyPlayers()

        tryHls(proxyM3u8, (err2) => {
          console.warn('[StreamFlow] HLS (VOD) failed:', err2)
          setStatus('')
          setError(`Could not play this file.\nNative: ${err1}\nHLS: ${err2}`)
        })
      })
    }
  }, [destroyPlayers, tryHls, tryMpegts, tryNative, settings.defaultStreamFormat])

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return
    startPlayback(streamUrl)
    return () => { destroyPlayers() }
  }, [streamUrl])

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100
  }, [volume])

  // Detect available audio/text tracks
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const refreshTracks = () => {
      const vAny = vid as any
      if (vAny.audioTracks && vAny.audioTracks.length > 0) {
        const tracks: typeof audioTracks = []
        for (let i = 0; i < vAny.audioTracks.length; i++) {
          const t = vAny.audioTracks[i]
          tracks.push({ id: i, label: t.label || `Track ${i + 1}`, language: t.language || '', enabled: t.enabled })
        }
        setAudioTracks(tracks)
      }
      if (vid.textTracks && vid.textTracks.length > 0) {
        const tracks: typeof textTracks = []
        for (let i = 0; i < vid.textTracks.length; i++) {
          const t = vid.textTracks[i]
          tracks.push({ index: i, label: t.label || `Subtitle ${i + 1}`, language: t.language || '', mode: t.mode })
        }
        setTextTracks(tracks)
      }
    }

    vid.addEventListener('loadedmetadata', refreshTracks)
    const interval = setInterval(refreshTracks, 3000)
    return () => {
      vid.removeEventListener('loadedmetadata', refreshTracks)
      clearInterval(interval)
    }
  }, [streamUrl])

  // VOD progress saving — every 10 seconds
  useEffect(() => {
    if (!isVod || !streamUrl) return
    const vid = videoRef.current
    if (!vid) return

    const save = () => {
      if (!vid.duration || !isFinite(vid.duration) || vid.duration <= 0) return
      const progress = vid.currentTime / vid.duration
      if (progress > 0.01) {
        const baseUrl = streamUrl.replace(/#resume=[\d.]+$/, '')
        const name = channelName || ''
        const logo = channelLogo || null
        addToHistory({ streamId: 0, name, logo, type: activeTab, progress })
      }
    }

    const interval = setInterval(save, 10000)
    return () => clearInterval(interval)
  }, [isVod, streamUrl, channelName, channelLogo, activeTab, addToHistory])

  // VOD resume on mount — seek to saved position
  useEffect(() => {
    if (!isVod || !streamUrl || !settings.resumeVod) return
    const vid = videoRef.current
    if (!vid) return

    const resumeMatch = streamUrl.match(/#resume=([\d.]+)$/)
    if (!resumeMatch) return
    const resumePos = parseFloat(resumeMatch[1])
    if (isNaN(resumePos) || resumePos <= 0.05 || resumePos >= 0.95) return

    const onLoaded = () => {
      if (vid.duration && isFinite(vid.duration)) {
        vid.currentTime = resumePos * vid.duration
      }
      vid.removeEventListener('loadedmetadata', onLoaded)
    }
    vid.addEventListener('loadedmetadata', onLoaded)
    return () => vid.removeEventListener('loadedmetadata', onLoaded)
  }, [streamUrl, isVod, settings.resumeVod])

  const selectAudioTrack = useCallback((idx: number) => {
    const vid = videoRef.current as any
    if (!vid?.audioTracks) return
    for (let i = 0; i < vid.audioTracks.length; i++) {
      vid.audioTracks[i].enabled = i === idx
    }
    setAudioTracks(prev => prev.map((t, i) => ({ ...t, enabled: i === idx })))
  }, [])

  const selectTextTrack = useCallback((idx: number | null) => {
    const vid = videoRef.current
    if (!vid?.textTracks) return
    for (let i = 0; i < vid.textTracks.length; i++) {
      vid.textTracks[i].mode = i === idx ? 'showing' : 'hidden'
    }
    setTextTracks(prev => prev.map((t, i) => ({ ...t, mode: i === idx ? 'showing' : 'hidden' })))
  }, [])

  const resetHideTimer = () => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }
  useEffect(() => { resetHideTimer(); return () => clearTimeout(hideTimer.current) }, [])

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setFullscreen(false) }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) { containerRef.current.requestFullscreen(); setFullscreen(true) }
    else { document.exitFullscreen(); setFullscreen(false) }
  }, [setFullscreen])

  const togglePause = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) { vid.play().catch(() => {}); setPaused(false) }
    else { vid.pause(); setPaused(true) }
  }, [])

  const toggleMute = useCallback(() => {
    if (volume > 0) setVolume(0); else setVolume(80)
  }, [volume, setVolume])

  const launchExternal = useCallback(async () => {
    if (!streamUrl) return
    const electron = (window as any).electron
    if (!electron?.player?.launchExternal) return
    // Use the .ts URL for external players — they handle MPEG-TS natively
    const tsUrl = streamUrl.includes('/live/')
      ? streamUrl.replace(/\.\w+$/, '.ts')
      : streamUrl
    const result = await electron.player.launchExternal(tsUrl, settings.externalPlayerPath)
    if (!result.success) setError(result.error || 'External player failed to launch.')
  }, [streamUrl, settings.externalPlayerPath])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isPlaying) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      switch (e.key) {
        case ' ': e.preventDefault(); togglePause(); break
        case 'f': case 'F': case 'F11': e.preventDefault(); toggleFullscreen(); break
        case 'm': case 'M': toggleMute(); break
        case 'ArrowUp': e.preventDefault(); setVolume(Math.min(100, volume + 5)); break
        case 'ArrowDown': e.preventDefault(); setVolume(Math.max(0, volume - 5)); break
        case 'ArrowLeft':
          if (activeTab !== 'live' && videoRef.current)
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
          break
        case 'ArrowRight':
          if (activeTab !== 'live' && videoRef.current)
            videoRef.current.currentTime += 10
          break
        case 'Tab': e.preventDefault(); setShowStrip(v => !v); break
        case 'Escape':
          if (showStrip) setShowStrip(false)
          else if (document.fullscreenElement) document.exitFullscreen()
          else stopStream()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, volume, activeTab, showStrip, togglePause, toggleMute, toggleFullscreen, stopStream, setVolume])

  if (!isPlaying || !streamUrl) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-base">
        <div className="text-center text-muted">
          <div className="w-16 h-16 rounded-full bg-overlay/[0.03] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-30 ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <p className="text-[13px] opacity-50">Select a channel to watch</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full relative bg-base overflow-hidden"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        autoPlay playsInline
        onClick={togglePause}
      />

      {/* Status spinner */}
      {status && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-base/70 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin shrink-0" />
            <span className="text-foreground/80 text-sm">{status}</span>
          </div>
        </div>
      )}

      {/* Paused indicator */}
      {paused && !status && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-base/60 backdrop-blur-sm flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      )}

      {/* Error screen */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-base/85">
          <div className="text-center max-w-lg px-8">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <p className="text-foreground text-base font-semibold mb-2">Playback Error</p>
            {codecInfo && (
              <div className="mb-3 px-3 py-1.5 rounded-lg bg-overlay/[0.05] border border-overlay/[0.08] inline-block">
                <span className="text-foreground/40 text-xs">Codec: </span>
                <span className="text-foreground/70 text-xs font-mono">{codecInfo}</span>
              </div>
            )}
            <p className="text-foreground/45 text-xs mb-6 leading-relaxed whitespace-pre-line">{error}</p>
            <div className="flex flex-col gap-3 items-center w-full">
              <button
                onClick={launchExternal}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-foreground text-sm font-medium transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open in External Player (mpv / VLC)
              </button>
              <button
                onClick={() => {
                  const electron = (window as any).electron
                  electron?.shell?.openExternal('ms-windows-store://pdp/?ProductId=9N4WGH0Z6VHQ')
                  // fallback: open in browser
                  window.open('https://apps.microsoft.com/detail/9n4wgh0z6vhq', '_blank')
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-overlay/[0.06] hover:bg-overlay/10 text-foreground/70 text-sm transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/></svg>
                Install HEVC Extension (Windows Store)
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => { setError(null); setCodecInfo(''); streamUrl && startPlayback(streamUrl) }}
                  className="px-5 py-2 rounded-lg bg-overlay/10 hover:bg-overlay/20 text-foreground text-sm transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={stopStream}
                  className="px-5 py-2 rounded-lg bg-overlay/[0.06] hover:bg-overlay/10 text-foreground/70 text-sm transition-colors"
                >
                  Go Back
                </button>
              </div>
              {!settings.externalPlayerPath && (
                <p className="text-foreground/25 text-xs mt-1">Configure mpv or VLC in Settings → Player for best compatibility</p>
              )}
            </div>
          </div>
        </div>
      )}

      <MiniChannelStrip visible={showStrip} />

      {/* Controls overlay */}
      <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top bar */}
        <div className="bg-gradient-to-b from-base/70 to-transparent px-5 py-3 flex items-center gap-3 pointer-events-auto">
          <button onClick={stopStream} className="w-9 h-9 rounded-lg bg-overlay/10 hover:bg-overlay/20 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          {channelLogo && <img src={channelLogo} className="w-8 h-8 object-contain rounded" alt="" />}
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-medium truncate">{channelName}</p>
            {activeTab === 'live' ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-[11px] font-semibold tracking-wide">LIVE</span>
              </div>
            ) : (
              <p className="text-foreground/40 text-[11px] mt-0.5">Video on Demand</p>
            )}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="pointer-events-auto">
          <div className="h-28 bg-gradient-to-t from-base/90 to-transparent" />
          <div className="bg-base/60 backdrop-blur-xl px-5 pb-3 pt-0">
            {/* Seek bar — shown for VOD, hidden for live */}
            {isVod && duration > 0 && (
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[11px] text-foreground/60 font-mono tabular-nums w-[52px] text-right shrink-0">{formatTime(currentTime)}</span>
                <div
                  ref={seekBarRef}
                  className="flex-1 h-5 flex items-center cursor-pointer group/seek"
                  onClick={handleSeek}
                  onMouseDown={() => setSeeking(true)}
                  onMouseUp={(e) => { setSeeking(false); handleSeek(e) }}
                  onMouseMove={handleSeekDrag}
                >
                  <div className="w-full h-[3px] group-hover/seek:h-[5px] rounded-full bg-overlay/[0.15] relative transition-all">
                    {/* Buffered */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-overlay/[0.2]"
                      style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
                    />
                    {/* Progress */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-accent"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                    {/* Thumb */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent shadow-md shadow-black/50 opacity-0 group-hover/seek:opacity-100 transition-opacity"
                      style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 6px)` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] text-foreground/40 font-mono tabular-nums w-[52px] shrink-0">{formatTime(duration)}</span>
              </div>
            )}

            {/* Buttons row */}
            <div className="flex items-center gap-2">
              <button onClick={togglePause} className="w-9 h-9 rounded-lg bg-overlay/[0.08] hover:bg-overlay/[0.15] flex items-center justify-center transition-colors">
                {paused
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                }
              </button>
              <button onClick={stopStream} className="w-9 h-9 rounded-lg bg-overlay/[0.08] hover:bg-overlay/[0.15] flex items-center justify-center transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-foreground"><rect x="5" y="5" width="14" height="14" rx="1.5"/></svg>
              </button>

              {/* Time display for VOD inline (when seek bar is not visible yet) */}
              {isVod && duration <= 0 && (
                <span className="text-[11px] text-foreground/40 font-mono ml-1">Loading...</span>
              )}

              {/* Live indicator */}
              {!isVod && (
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 text-[10px] font-bold tracking-wider">LIVE</span>
                </div>
              )}

              <div className="flex-1" />

              <div className="flex items-center gap-1.5">
                <button onClick={toggleMute} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    {volume === 0 && <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
                    {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
                    {volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
                  </svg>
                </button>
                <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-20 accent-range" />
              </div>

              <QualitySelector hls={hlsInstance} />

              {/* Track selector */}
              {(audioTracks.length > 1 || textTracks.length > 0) && (
                <div className="relative">
                  <button
                    onClick={() => setShowTracks(v => !v)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${showTracks ? 'bg-accent text-foreground' : 'bg-overlay/[0.08] hover:bg-overlay/[0.15] text-foreground'}`}
                    title="Audio & Subtitles"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 5h20M2 12h14M2 19h10"/></svg>
                  </button>
                  {showTracks && (
                    <div className="absolute bottom-10 right-0 w-56 bg-base/90 backdrop-blur-xl rounded-xl border border-overlay/10 p-3 z-50" onClick={e => e.stopPropagation()}>
                      {audioTracks.length > 1 && (
                        <div className="mb-3">
                          <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1.5">Audio</p>
                          {audioTracks.map(t => (
                            <button
                              key={t.id}
                              onClick={() => selectAudioTrack(t.id)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${t.enabled ? 'bg-accent/20 text-accent' : 'text-foreground/60 hover:bg-overlay/[0.06] hover:text-foreground'}`}
                            >
                              {t.label}{t.language ? ` (${t.language})` : ''}
                            </button>
                          ))}
                        </div>
                      )}
                      {textTracks.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1.5">Subtitles</p>
                          <button
                            onClick={() => selectTextTrack(null)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${textTracks.every(t => t.mode !== 'showing') ? 'bg-accent/20 text-accent' : 'text-foreground/60 hover:bg-overlay/[0.06] hover:text-foreground'}`}
                          >
                            Off
                          </button>
                          {textTracks.map(t => (
                            <button
                              key={t.index}
                              onClick={() => selectTextTrack(t.index)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${t.mode === 'showing' ? 'bg-accent/20 text-accent' : 'text-foreground/60 hover:bg-overlay/[0.06] hover:text-foreground'}`}
                            >
                              {t.label}{t.language ? ` (${t.language})` : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={launchExternal}
                className="w-8 h-8 rounded-md bg-overlay/[0.08] hover:bg-overlay/[0.15] flex items-center justify-center transition-colors"
                title="Open in external player"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>

              <button
                onClick={() => setShowStrip(v => !v)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${showStrip ? 'bg-accent text-foreground' : 'bg-overlay/[0.08] hover:bg-overlay/[0.15] text-foreground'}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/></svg>
              </button>

              <button onClick={toggleFullscreen} className="w-8 h-8 rounded-md bg-overlay/[0.08] hover:bg-overlay/[0.15] flex items-center justify-center transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
