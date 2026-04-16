import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/store'
import { getXtreamService } from '@/services/xtream'
import { useI18n } from '@/hooks/useI18n'
import type { VodStream } from '@/types'

function safeFilename(name: string, ext: string) {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 120) || 'video'
  const e = ext.replace(/^\./, '') || 'mp4'
  return `${base}.${e}`
}

const BYTES_PER_GB = 1024 ** 3

type DownloadStats = { received: number; total: number; etaSec: number | null }

interface Props {
  vod: VodStream
  onClose: () => void
}

export default function VodDetail({ vod, onClose }: Props) {
  const playlists = useAppStore(s => s.playlists)
  const activePlaylistId = useAppStore(s => s.activePlaylistId)
  const playStream = useAppStore(s => s.playStream)
  const favorites = useAppStore(s => s.favorites)
  const toggleFavorite = useAppStore(s => s.toggleFavorite)
  const watchHistory = useAppStore(s => s.watchHistory)
  const settings = useAppStore(s => s.settings)
  const playlist = playlists.find(p => p.id === activePlaylistId)
  const isFav = favorites.includes(vod.stream_id)
  const { t } = useI18n()

  const [vodInfo, setVodInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloadStats, setDownloadStats] = useState<DownloadStats | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'busy' | 'done' | 'error' | 'canceled'>('idle')
  const downloadProgressUnsub = useRef<(() => void) | null>(null)
  const smoothedBpsRef = useRef(0)
  const speedAnchorRef = useRef<{ r: number; t: number } | null>(null)

  const formatEtaSeconds = useCallback(
    (sec: number) => {
      if (!isFinite(sec) || sec < 5) return null
      if (sec < 90) return t('vod.etaSeconds', { n: String(Math.round(sec)) })
      if (sec < 3600) return t('vod.etaMinutes', { n: String(Math.max(1, Math.round(sec / 60))) })
      const h = Math.floor(sec / 3600)
      const m = Math.max(0, Math.round((sec % 3600) / 60))
      return t('vod.etaHoursMinutes', { h: String(h), m: String(m) })
    },
    [t],
  )

  useEffect(() => {
    if (!playlist) return
    setLoading(true)
    const svc = getXtreamService(playlist)
    svc.getVodInfo(vod.stream_id)
      .then(data => setVodInfo(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [vod.stream_id, playlist])

  const info = vodInfo?.info
  const historyEntry = watchHistory.find(h => h.streamId === vod.stream_id)
  const savedProgress = historyEntry?.progress

  const handlePlay = (resumePos?: number) => {
    if (!playlist) return
    const svc = getXtreamService(playlist)
    const url = svc.getVodStreamUrl(vod.stream_id, vod.container_extension || 'mp4')
    const resumeParam = resumePos !== undefined ? `#resume=${resumePos}` : ''
    playStream(url + resumeParam, vod.name, vod.stream_icon, vod.stream_id)
    onClose()
  }

  const ext = vod.container_extension || 'mp4'
  const rawStreamUrl = playlist ? getXtreamService(playlist).getVodStreamUrl(vod.stream_id, ext) : ''
  const canDownload =
    typeof window !== 'undefined' &&
    !!(window as any).electron?.vod?.download &&
    !!rawStreamUrl &&
    !rawStreamUrl.toLowerCase().includes('.m3u8')

  useEffect(() => () => {
    downloadProgressUnsub.current?.()
    downloadProgressUnsub.current = null
    void (window as any).electron?.vod?.cancelDownload?.()
  }, [])

  const handleDownload = useCallback(async () => {
    const el = (window as any).electron?.vod
    if (!el?.download || !rawStreamUrl) return
    downloadProgressUnsub.current?.()
    downloadProgressUnsub.current = null
    smoothedBpsRef.current = 0
    speedAnchorRef.current = null
    setDownloadStatus('busy')
    setDownloadStats({ received: 0, total: 0, etaSec: null })
    try {
      if (typeof el.onDownloadProgress === 'function') {
        downloadProgressUnsub.current = el.onDownloadProgress((p: { received: number; total: number }) => {
          const now = Date.now()
          const { received, total } = p

          const anchor = speedAnchorRef.current
          if (!anchor) {
            speedAnchorRef.current = { r: received, t: now }
          } else if (now - anchor.t >= 400) {
            const dt = (now - anchor.t) / 1000
            const dr = received - anchor.r
            if (dt > 0 && dr >= 0) {
              const inst = dr / dt
              const sm = smoothedBpsRef.current
              smoothedBpsRef.current = sm > 0 ? sm * 0.85 + inst * 0.15 : inst
            }
            speedAnchorRef.current = { r: received, t: now }
          }

          let etaSec: number | null = null
          const speed = smoothedBpsRef.current
          if (total > 0 && received > 0 && speed > 32 * 1024) {
            const sec = (total - received) / speed
            if (sec >= 5 && sec < 72 * 3600) etaSec = sec
          }

          setDownloadStats({ received, total, etaSec })
        })
      }
      const result = await el.download({
        url: rawStreamUrl,
        defaultFilename: safeFilename(vod.name, ext),
      })
      downloadProgressUnsub.current?.()
      downloadProgressUnsub.current = null
      if (result?.canceled) {
        setDownloadStatus('canceled')
        setDownloadStats(null)
        return
      }
      if (result?.ok) {
        setDownloadStatus('done')
        setDownloadStats(null)
      } else {
        setDownloadStatus('error')
        setDownloadStats(null)
      }
    } catch {
      downloadProgressUnsub.current?.()
      downloadProgressUnsub.current = null
      setDownloadStatus('error')
      setDownloadStats(null)
    }
  }, [rawStreamUrl, vod.name, ext])

  const handleCancelDownload = useCallback(async () => {
    const el = (window as any).electron?.vod
    if (!el?.cancelDownload) return
    await el.cancelDownload()
  }, [])

  const showResumeChoice =
    savedProgress &&
    savedProgress > 0.05 &&
    savedProgress < 0.95 &&
    (settings.resumeVod || settings.alwaysShowResumePrompt)

  const formatDuration = (dur: string | undefined) => {
    if (!dur) return null
    const mins = parseInt(dur, 10)
    if (isNaN(mins)) return dur
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[650px] max-w-[90vw] max-h-[85vh] bg-surface rounded-2xl border border-border overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-56 bg-subtle overflow-hidden shrink-0">
          {vod.stream_icon && (
            <img src={vod.stream_icon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
            {vod.stream_icon && (
              <img src={vod.stream_icon} alt="" className="w-28 h-40 object-cover rounded-lg border border-overlay/10 shadow-2xl shrink-0" />
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl font-bold text-foreground">{vod.name}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-secondary flex-wrap">
                {(info?.rating ?? vod.rating) && <span>★ {info?.rating ?? vod.rating}</span>}
                {info?.releasedate && <span>{info.releasedate.slice(0, 4)}</span>}
                {info?.duration && <span>{formatDuration(info.duration)}</span>}
                {info?.genre && <span>{info.genre}</span>}
                {vod.container_extension && <span className="uppercase">{vod.container_extension}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-base/50 hover:bg-base/70 flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-3">
          {showResumeChoice ? (
            <>
              <button
                onClick={() => handlePlay(savedProgress)}
                className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-foreground py-2.5 rounded-xl font-medium text-[13px] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                {t('vod.resume')}
              </button>
              <button
                onClick={() => handlePlay()}
                className="px-4 py-2.5 rounded-xl bg-overlay/[0.06] hover:bg-overlay/[0.1] text-foreground/70 text-[13px] font-medium transition-colors"
              >
                {t('vod.startOver')}
              </button>
            </>
          ) : (
            <button
              onClick={() => handlePlay()}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-foreground py-2.5 rounded-xl font-medium text-[13px] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {t('vod.play')}
            </button>
          )}
          <button
            onClick={() => toggleFavorite(vod.stream_id)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
              isFav ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-overlay/[0.04] border-border text-muted hover:text-foreground'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          {canDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadStatus === 'busy'}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-border bg-overlay/[0.04] text-muted hover:text-foreground hover:bg-overlay/[0.08] transition-colors disabled:opacity-50"
              title={t('vod.download')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
            </button>
          )}
        </div>
        {canDownload && (
          <p className="text-[10px] text-muted/80 leading-relaxed px-0.5">{t('vod.downloadDisclaimer')}</p>
        )}
        {downloadStatus === 'busy' && downloadStats && (
          <div className="w-full space-y-2.5 rounded-xl border border-border bg-overlay/[0.03] px-3 py-3">
            <div className="space-y-1 text-[11px] text-secondary leading-snug">
              <p className="text-foreground/85 font-medium tabular-nums">
                {downloadStats.total > 0
                  ? t('vod.downloadGbPair', {
                      used: (downloadStats.received / BYTES_PER_GB).toFixed(2),
                      total: (downloadStats.total / BYTES_PER_GB).toFixed(2),
                    })
                  : t('vod.downloadGbOnly', {
                      used: (downloadStats.received / BYTES_PER_GB).toFixed(2),
                    })}
              </p>
              <p className="text-muted">
                {downloadStats.total > 0
                  ? downloadStats.etaSec != null
                    ? (() => {
                        const eta = formatEtaSeconds(downloadStats.etaSec)
                        return eta ? t('vod.downloadEtaLine', { eta }) : t('vod.downloadEtaPending')
                      })()
                    : t('vod.downloadEtaPending')
                  : t('vod.downloadEtaNoTotal')}
              </p>
              {downloadStats.total > 0 && (
                <p className="text-muted/90 tabular-nums">
                  {t('vod.downloadingPct', {
                    pct: String(Math.min(100, Math.round((100 * downloadStats.received) / downloadStats.total))),
                  })}
                </p>
              )}
            </div>
            <div className="h-2 rounded-full bg-overlay/15 overflow-hidden">
              <div
                className={`h-full rounded-full bg-accent transition-[width] duration-300 ease-out ${
                  downloadStats.total <= 0 ? 'w-2/5 max-w-[45%] opacity-70 animate-pulse' : ''
                }`}
                style={
                  downloadStats.total > 0
                    ? {
                        width: `${Math.min(100, Math.max(0, (100 * downloadStats.received) / downloadStats.total))}%`,
                      }
                    : undefined
                }
              />
            </div>
            <button
              type="button"
              onClick={handleCancelDownload}
              className="w-full py-2.5 rounded-xl text-[13px] font-medium border border-red-500/35 bg-red-500/12 text-red-200 hover:bg-red-500/20 hover:border-red-400/45 transition-colors"
            >
              {t('vod.stopDownload')}
            </button>
          </div>
        )}
        {downloadStatus === 'canceled' && (
          <p className="text-[11px] text-muted">{t('vod.downloadCanceled')}</p>
        )}
        {downloadStatus === 'done' && <p className="text-[11px] text-green-400/90">{t('vod.downloadDone')}</p>}
        {downloadStatus === 'error' && <p className="text-[11px] text-red-400/90">{t('vod.downloadError')}</p>}
        </div>

        {/* Info section */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-muted text-[11px] ml-2">Loading details...</span>
            </div>
          )}

          {!loading && info && (
            <div className="space-y-4">
              {/* Plot */}
              {info.plot && (
                <div>
                  <p className="text-[11px] font-semibold text-muted/50 uppercase tracking-wider mb-1.5">Plot</p>
                  <p className="text-[13px] text-foreground/70 leading-relaxed">{info.plot}</p>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {info.director && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted/50 uppercase tracking-wider">Director</p>
                    <p className="text-[12px] text-foreground/70 mt-0.5">{info.director}</p>
                  </div>
                )}
                {info.genre && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted/50 uppercase tracking-wider">Genre</p>
                    <p className="text-[12px] text-foreground/70 mt-0.5">{info.genre}</p>
                  </div>
                )}
                {info.releasedate && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted/50 uppercase tracking-wider">Release Date</p>
                    <p className="text-[12px] text-foreground/70 mt-0.5">{info.releasedate}</p>
                  </div>
                )}
                {info.duration && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted/50 uppercase tracking-wider">Duration</p>
                    <p className="text-[12px] text-foreground/70 mt-0.5">{formatDuration(info.duration)}</p>
                  </div>
                )}
              </div>

              {/* Cast */}
              {info.cast && (
                <div>
                  <p className="text-[10px] font-semibold text-muted/50 uppercase tracking-wider mb-1">Cast</p>
                  <p className="text-[12px] text-foreground/70 leading-relaxed">{info.cast}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
