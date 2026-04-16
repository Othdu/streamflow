import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { getXtreamService } from '@/services/xtream'
import type { Series, SeriesInfo, Episode } from '@/types'

interface Props {
  series: Series
  onClose: () => void
}

export default function SeriesDetail({ series, onClose }: Props) {
  const playlists = useAppStore(s => s.playlists)
  const activePlaylistId = useAppStore(s => s.activePlaylistId)
  const playStream = useAppStore(s => s.playStream)
  const playlist = playlists.find(p => p.id === activePlaylistId)

  const [info, setInfo] = useState<SeriesInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSeason, setActiveSeason] = useState<string | null>(null)

  useEffect(() => {
    if (!playlist) return
    setLoading(true)
    setError(null)
    const svc = getXtreamService(playlist)
    svc.getSeriesInfo(series.series_id)
      .then(data => {
        setInfo(data)
        const seasons = Object.keys(data.episodes || {})
        if (seasons.length > 0) setActiveSeason(seasons[0])
      })
      .catch(e => setError(e.message || 'Failed to load series info'))
      .finally(() => setLoading(false))
  }, [series.series_id, playlist])

  const handlePlayEpisode = (episode: Episode) => {
    if (!playlist) return
    const svc = getXtreamService(playlist)
    const url = svc.getSeriesStreamUrl(Number(episode.id), episode.container_extension || 'mp4')
    const title = `${series.name} - S${activeSeason}E${episode.episode_num} ${episode.title || ''}`
    playStream(url, title.trim(), series.cover, Number(episode.id))
    onClose()
  }

  const episodes = activeSeason && info?.episodes?.[activeSeason]
    ? info.episodes[activeSeason]
    : []
  const seasonKeys = info?.episodes ? Object.keys(info.episodes) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[800px] max-w-[90vw] max-h-[85vh] bg-surface rounded-2xl border border-border overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-52 bg-subtle shrink-0 overflow-hidden">
          {series.cover && (
            <img src={series.cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
            {series.cover && (
              <img src={series.cover} alt="" className="w-24 h-36 object-cover rounded-lg border border-overlay/10 shadow-2xl shrink-0" />
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl font-bold text-foreground truncate">{series.name}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-secondary">
                {series.genre && <span>{series.genre}</span>}
                {series.rating && <span>★ {series.rating}</span>}
                {series.releaseDate && <span>{series.releaseDate}</span>}
              </div>
              {series.plot && (
                <p className="text-[11px] text-muted mt-2 line-clamp-2">{series.plot}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-base/50 hover:bg-base/70 flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div>
                <p className="text-red-400 text-sm mb-1">Failed to load episodes</p>
                <p className="text-muted text-xs">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && info && (
            <>
              {/* Season tabs */}
              {seasonKeys.length > 1 && (
                <div className="flex gap-1 px-5 pt-3 pb-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
                  {seasonKeys.map(sKey => (
                    <button
                      key={sKey}
                      onClick={() => setActiveSeason(sKey)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                        activeSeason === sKey
                          ? 'bg-accent text-foreground'
                          : 'bg-overlay/[0.05] text-secondary hover:text-foreground hover:bg-overlay/[0.08]'
                      }`}
                    >
                      Season {sKey}
                    </button>
                  ))}
                </div>
              )}

              {/* Episode list */}
              <div className="flex-1 overflow-y-auto px-5 py-2">
                {episodes.length === 0 && (
                  <p className="text-muted text-sm text-center py-8">No episodes found for this season</p>
                )}
                {episodes.map((ep: Episode) => (
                  <button
                    key={ep.id}
                    onClick={() => handlePlayEpisode(ep)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-overlay/[0.04] transition-colors group mb-0.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-overlay/[0.04] flex items-center justify-center text-muted text-[11px] font-bold shrink-0 group-hover:bg-accent group-hover:text-foreground transition-colors">
                      {ep.episode_num}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[12.5px] text-foreground/90 font-medium truncate">
                        {ep.title || `Episode ${ep.episode_num}`}
                      </p>
                      {ep.info?.duration && (
                        <p className="text-[10px] text-muted mt-0.5">{ep.info.duration}</p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
