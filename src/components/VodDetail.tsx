import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { getXtreamService } from '@/services/xtream'
import type { VodStream } from '@/types'

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

  const [vodInfo, setVodInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  const formatDuration = (dur: string | undefined) => {
    if (!dur) return null
    const mins = parseInt(dur, 10)
    if (isNaN(mins)) return dur
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const formatProgress = (progress: number, durationStr?: string) => {
    if (!durationStr) {
      const pct = Math.round(progress * 100)
      return `${pct}%`
    }
    const totalMins = parseInt(durationStr, 10)
    if (isNaN(totalMins)) return `${Math.round(progress * 100)}%`
    const elapsed = Math.round(progress * totalMins)
    const h = Math.floor(elapsed / 60)
    const m = elapsed % 60
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `${m}:00`
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
        <div className="px-5 py-4 flex items-center gap-3 shrink-0">
          {savedProgress && savedProgress > 0.05 && savedProgress < 0.95 && settings.resumeVod ? (
            <>
              <button
                onClick={() => handlePlay(savedProgress)}
                className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-foreground py-2.5 rounded-xl font-medium text-[13px] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Resume from {formatProgress(savedProgress, info?.duration)}
              </button>
              <button
                onClick={() => handlePlay()}
                className="px-4 py-2.5 rounded-xl bg-overlay/[0.06] hover:bg-overlay/[0.1] text-foreground/70 text-[13px] font-medium transition-colors"
              >
                Start Over
              </button>
            </>
          ) : (
            <button
              onClick={() => handlePlay()}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-foreground py-2.5 rounded-xl font-medium text-[13px] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Play
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
