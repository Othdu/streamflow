import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAppStore } from '@/store'
import { getXtreamService } from '@/services/xtream'
import { useI18n } from '@/hooks/useI18n'
import SeriesDetail from './SeriesDetail'
import VodDetail from './VodDetail'
import type { LiveStream, VodStream, Series, ViewMode } from '@/types'

/* ─── Poster Card (VOD / Series) ─── 2:3 ratio, title on card ─── */
function PosterCard({ stream, onPlay, isFav, onToggleFav }: {
  stream: VodStream | Series
  onPlay: () => void
  isFav: boolean
  onToggleFav: () => void
}) {
  const isSeries = 'episode_run_time' in stream
  const poster = isSeries ? (stream as Series).cover : (stream as VodStream).stream_icon
  const rating = !isSeries ? (stream as VodStream).rating : null
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div onClick={onPlay} className="group relative cursor-pointer select-none">
      <div className="channel-card relative aspect-[2/3] rounded-xl overflow-hidden bg-card group-hover:ring-2 group-hover:ring-accent/50 transition-all duration-200 group-hover:shadow-xl group-hover:shadow-accent/10 group-hover:-translate-y-1">
        {poster && !imgError ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 shimmer-bg animate-shimmer" />}
            <img
              src={poster} alt="" loading="lazy"
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.06] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-card to-card">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-foreground/[0.08] mb-2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg>
            <span className="text-[10px] font-medium text-foreground/[0.15] truncate max-w-[80%] text-center">{stream.name}</span>
          </div>
        )}

        {/* Always-visible bottom gradient with title */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base/90 via-base/50 to-transparent pt-12 pb-2.5 px-2.5">
          <p className="text-[11px] text-foreground font-medium leading-tight line-clamp-2">{stream.name}</p>
          <p className="text-[9px] text-foreground/40 mt-0.5 truncate">
            {isSeries ? ((stream as Series).genre || 'Series') : 'Movie'}
          </p>
        </div>

        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-base/20">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center shadow-xl shadow-accent/30 scale-90 group-hover:scale-100 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
        </div>

        {/* Rating badge */}
        {rating && Number(rating) > 0 && (
          <div className="absolute top-2 left-2 bg-base/70 backdrop-blur-sm px-1.5 py-[3px] rounded-md text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
            ★ {Number(rating).toFixed(1)}
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav() }}
          className={`btn-favorite absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isFav ? 'active bg-accent text-foreground opacity-100' : 'bg-base/50 backdrop-blur-sm text-foreground/30 opacity-0 group-hover:opacity-100 hover:text-foreground'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ─── Live Channel Row (list view) ─── */
function LiveRow({ stream, onPlay, isFav, onToggleFav }: {
  stream: LiveStream; onPlay: () => void; isFav: boolean; onToggleFav: () => void
}) {
  const [imgError, setImgError] = useState(false)
  return (
    <div onClick={onPlay} className="channel-card group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-overlay/[0.04] border border-transparent hover:border-overlay/[0.06] transition-all">
      <div className="w-10 h-10 rounded-lg bg-overlay/[0.04] shrink-0 overflow-hidden flex items-center justify-center border border-overlay/[0.04]">
        {stream.stream_icon && !imgError
          ? <img src={stream.stream_icon} alt="" className="w-full h-full object-contain p-1" onError={() => setImgError(true)} />
          : <span className="text-foreground/15 text-xs font-bold">{stream.name.charAt(0).toUpperCase()}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground/90 font-medium truncate">{stream.name}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {stream.tv_archive === 1 && (
          <span className="px-1.5 py-[2px] rounded text-[8px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 mr-1">CATCH-UP</span>
        )}
        <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-60" />
        <span className="live-badge text-emerald-400 text-[9px] font-semibold tracking-wider opacity-60">LIVE</span>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onToggleFav() }}
        className={`btn-favorite w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isFav ? 'active text-accent' : 'text-foreground/15 opacity-0 group-hover:opacity-100 hover:text-foreground'}`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <div className="w-8 h-8 rounded-lg bg-accent/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
      </div>
    </div>
  )
}

/* ─── Live Channel Tile (grid view) ─── */
function LiveTile({ stream, onPlay, isFav, onToggleFav }: {
  stream: LiveStream; onPlay: () => void; isFav: boolean; onToggleFav: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  return (
    <div onClick={onPlay} className="group relative cursor-pointer select-none">
      <div className="channel-card relative aspect-square rounded-xl overflow-hidden bg-card border border-overlay/[0.04] group-hover:border-accent/40 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-accent/5">
        {stream.stream_icon && !imgError ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 shimmer-bg animate-shimmer" />}
            <img
              src={stream.stream_icon} alt="" loading="lazy"
              className={`w-full h-full object-contain p-3 transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-bold text-foreground/8">{stream.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-base/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" className="ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleFav() }}
          className={`btn-favorite absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-all ${isFav ? 'active bg-accent text-foreground opacity-100' : 'bg-base/50 text-foreground/30 opacity-0 group-hover:opacity-100'}`}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        {stream.tv_archive === 1 && (
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-[2px] rounded text-[7px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">
            CATCH-UP
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-foreground/70 font-medium truncate leading-snug px-0.5">{stream.name}</p>
    </div>
  )
}

export default function ChannelGrid() {
  const playlists = useAppStore(s => s.playlists)
  const activePlaylistId = useAppStore(s => s.activePlaylistId)
  const activeTab = useAppStore(s => s.activeTab)
  const searchQuery = useAppStore(s => s.searchQuery)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)
  const streams = useAppStore(s => s.streams)
  const streamsLoading = useAppStore(s => s.streamsLoading)
  const dataError = useAppStore(s => s.dataError)
  const playStream = useAppStore(s => s.playStream)
  const favorites = useAppStore(s => s.favorites)
  const toggleFavorite = useAppStore(s => s.toggleFavorite)
  const showFavoritesOnly = useAppStore(s => s.showFavoritesOnly)
  const viewMode = useAppStore(s => s.viewMode)
  const setViewMode = useAppStore(s => s.setViewMode)
  const sortOrder = useAppStore(s => s.sortOrder)
  const setSortOrder = useAppStore(s => s.setSortOrder)
  const watchHistory = useAppStore(s => s.watchHistory)
  const removeFromHistory = useAppStore(s => s.removeFromHistory)
  const clearWatchHistory = useAppStore(s => s.clearWatchHistory)
  const { t, isRTL } = useI18n()
  const playlist = playlists.find(p => p.id === activePlaylistId)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [selectedVod, setSelectedVod] = useState<VodStream | null>(null)

  const parentRef = useRef<HTMLDivElement>(null)
  const isLive = activeTab === 'live'

  const [columns, setColumns] = useState(isLive ? 8 : 6)
  const [rowHeight, setRowHeight] = useState(isLive ? 130 : 260)

  const showGrid = isLive ? viewMode === 'grid' : true

  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width - 48
      if (isLive && viewMode === 'grid') {
        const cols = Math.max(4, Math.floor(w / 120))
        const cardW = (w - (cols - 1) * 10) / cols
        setColumns(cols)
        setRowHeight(Math.ceil(cardW) + 28)
      } else if (!isLive) {
        const cols = Math.max(3, Math.floor(w / 150))
        const cardW = (w - (cols - 1) * 12) / cols
        setColumns(cols)
        setRowHeight(Math.ceil(cardW * 1.5) + 12)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [isLive, viewMode])

  const filtered = useMemo(() => {
    let result = [...streams]
    if (showFavoritesOnly) {
      result = result.filter(s => {
        const id = 'stream_id' in s ? s.stream_id : (s as Series).series_id
        return favorites.includes(id)
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q))
    }
    if (sortOrder === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortOrder === 'added') {
      result.sort((a, b) => {
        const aA = 'added' in a ? Number(a.added) : 0
        const bA = 'added' in b ? Number(b.added) : 0
        return bA - aA
      })
    } else if (sortOrder === 'watched') {
      const hMap = new Map(watchHistory.map(h => [h.streamId, h.timestamp]))
      result.sort((a, b) => {
        const idA = 'stream_id' in a ? a.stream_id : (a as Series).series_id
        const idB = 'stream_id' in b ? b.stream_id : (b as Series).series_id
        return (hMap.get(idB) ?? 0) - (hMap.get(idA) ?? 0)
      })
    }
    return result
  }, [streams, searchQuery, showFavoritesOnly, favorites, sortOrder, watchHistory])

  const favSet = useMemo(() => new Set(favorites), [favorites])

  const recentlyWatched = useMemo(() =>
    watchHistory.filter(h => h.type === activeTab).slice(0, 20),
    [watchHistory, activeTab]
  )

  const rowCount = showGrid
    ? Math.ceil(filtered.length / columns)
    : filtered.length

  const estimatedRowHeight = showGrid ? rowHeight : 52

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 6,
  })

  const handlePlay = useCallback((stream: LiveStream | VodStream | Series) => {
    if (!playlist) return
    if (activeTab === 'live') {
      const svc = getXtreamService(playlist)
      const url = svc.getLiveStreamUrl((stream as LiveStream).stream_id)
      playStream(url, stream.name, (stream as LiveStream).stream_icon, (stream as LiveStream).stream_id)
    } else if (activeTab === 'vod') {
      setSelectedVod(stream as VodStream)
    } else {
      setSelectedSeries(stream as Series)
    }
  }, [playlist, activeTab, playStream])

  const label = isLive ? t('grid.channels') : activeTab === 'vod' ? t('grid.movies') : t('grid.series')
  const Label = isLive ? t('tab.live') : activeTab === 'vod' ? t('tab.movies') : t('tab.series')

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-base relative">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl from-accent/[0.03] via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 shrink-0 relative">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/50 mb-1">{activeTab === 'live' ? t('grid.liveTelevision') : activeTab === 'vod' ? t('grid.videoOnDemand') : t('grid.tvSeries')}</p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{Label}</h1>
              {!streamsLoading && filtered.length > 0 && (
                <span className="text-[11px] text-accent-hover/40 bg-accent/[0.08] px-2.5 py-0.5 rounded-full font-semibold ring-1 ring-accent/10">{filtered.length.toLocaleString()} {label}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as any)}
              className="bg-overlay/[0.04] border border-overlay/[0.06] rounded-lg px-3 py-[7px] text-[11px] text-foreground/50 focus:outline-none focus:border-accent/30 cursor-pointer hover:bg-overlay/[0.06] transition-colors"
            >
              <option value="name">{t('grid.sortAZ')}</option>
              <option value="added">{t('grid.sortRecent')}</option>
              <option value="watched">{t('grid.sortMostWatched')}</option>
            </select>

            {isLive && (
              <div className="flex bg-overlay/[0.03] rounded-lg border border-overlay/[0.04] p-[3px]">
                <button
                  onClick={() => setViewMode('list')}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-accent/15 text-accent-hover ring-1 ring-accent/20' : 'text-foreground/25 hover:text-foreground/50'}`}
                  title="List"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-accent/15 text-accent-hover ring-1 ring-accent/20' : 'text-foreground/25 hover:text-foreground/50'}`}
                  title="Grid"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
              </div>
            )}

            <div className="relative w-52">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20 pointer-events-none">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isLive ? t('grid.searchChannels') : activeTab === 'vod' ? t('grid.searchMovies') : t('grid.searchSeries')}
                className="search-input w-full bg-overlay/[0.03] border border-overlay/[0.05] rounded-lg pl-9 pr-8 py-[7px] text-[11px] text-foreground placeholder-foreground/20 focus:outline-none focus:border-accent/30 focus:bg-overlay/[0.05] focus:ring-1 focus:ring-accent/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-accent/10 via-overlay/[0.04] to-transparent" />
      </div>

      {/* Content */}
      <div ref={parentRef} className="flex-1 overflow-y-auto px-6 pt-4 pb-6">

        {/* Continue Watching */}
        {recentlyWatched.length > 0 && !searchQuery && !showFavoritesOnly && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-accent to-accent-hover" />
              <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.12em]">{t('grid.continueWatching')}</p>
              <div className="flex-1" />
              <button
                onClick={clearWatchHistory}
                className="text-[10px] text-foreground/20 hover:text-red-400 transition-colors px-2 py-0.5 rounded-md hover:bg-red-500/10"
              >
                {t('grid.clearAll')}
              </button>
            </div>
            <div className={`flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide ${isRTL() ? 'flex-row-reverse' : ''}`}>
              {recentlyWatched.map(item => (
                  <div
                  key={item.streamId}
                    className="channel-card flex-shrink-0 w-28 rounded-xl overflow-hidden bg-overlay/[0.02] border border-overlay/[0.04] hover:border-accent/30 hover:bg-overlay/[0.04] transition-all group relative"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromHistory(item.streamId) }}
                    className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-base/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    title="Remove"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      const s = streams.find(s => ('stream_id' in s ? s.stream_id : (s as Series).series_id) === item.streamId)
                      if (s) handlePlay(s)
                    }}
                  >
                    <div className={`${isLive ? 'aspect-square' : 'aspect-[2/3]'} bg-overlay/[0.02] flex items-center justify-center overflow-hidden`}>
                      {item.logo
                        ? <img src={item.logo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <span className="text-foreground/10 text-sm font-bold">{item.name.charAt(0)}</span>
                      }
                    </div>
                    <p className="text-[10px] text-foreground/50 truncate px-2 py-1.5 group-hover:text-foreground/70 transition-colors">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dataError && (
          <div className="text-red-400 text-sm bg-red-500/[0.06] border border-red-500/10 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {dataError}
          </div>
        )}

        {/* Loading */}
        {streamsLoading && (
          <div className={showGrid && !isLive ? 'grid gap-3' : showGrid ? 'grid gap-2.5' : 'space-y-1'}
            style={showGrid ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}>
            {Array.from({ length: showGrid ? columns * 3 : 12 }).map((_, i) => (
              showGrid && !isLive ? (
                <div key={i}>
                  <div className="skeleton aspect-[2/3] rounded-xl shimmer-bg animate-shimmer" />
                </div>
              ) : showGrid ? (
                <div key={i}>
                  <div className="skeleton aspect-square rounded-xl shimmer-bg animate-shimmer" />
                  <div className="mt-1.5 h-2.5 rounded shimmer-bg animate-shimmer" style={{ width: `${50 + (i * 19 % 40)}%` }} />
                </div>
              ) : (
                <div key={i} className="skeleton h-[52px] rounded-xl shimmer-bg animate-shimmer" />
              )
            ))}
          </div>
        )}

        {/* Empty state */}
        {!streamsLoading && filtered.length === 0 && !dataError && (
          <div className="flex flex-col items-center justify-center h-60 text-muted">
            <div className="w-16 h-16 rounded-2xl bg-overlay/[0.03] flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-30">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-sm font-medium">{t('grid.noFound', { label })}</p>
            <p className="text-xs text-muted/50 mt-1">{t('grid.tryDifferent')}</p>
          </div>
        )}

        {/* Grid (VOD/Series poster or live tile) */}
        {!streamsLoading && filtered.length > 0 && showGrid && (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vRow => {
              const start = vRow.index * columns
              const rowItems = filtered.slice(start, start + columns)
              return (
                <div
                  key={vRow.key}
                  className={`absolute left-0 right-0 grid ${isLive ? 'gap-2.5' : 'gap-3'}`}
                  style={{
                    top: 0,
                    transform: `translateY(${vRow.start}px)`,
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    height: vRow.size,
                    alignItems: 'start',
                  }}
                >
                  {rowItems.map(stream => {
                    const id = 'stream_id' in stream ? stream.stream_id : (stream as Series).series_id
                    return isLive ? (
                      <LiveTile
                        key={id}
                        stream={stream as LiveStream}
                        onPlay={() => handlePlay(stream)}
                        isFav={favSet.has(id)}
                        onToggleFav={() => toggleFavorite(id)}
                      />
                    ) : (
                      <PosterCard
                        key={id}
                        stream={stream as VodStream | Series}
                        onPlay={() => handlePlay(stream)}
                        isFav={favSet.has(id)}
                        onToggleFav={() => toggleFavorite(id)}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* List (live TV default) */}
        {!streamsLoading && filtered.length > 0 && !showGrid && (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vRow => {
              const stream = filtered[vRow.index] as LiveStream
              if (!stream) return null
              return (
                <div
                  key={vRow.key}
                  className="absolute left-0 right-0"
                  style={{ top: 0, height: vRow.size, transform: `translateY(${vRow.start}px)` }}
                >
                  <LiveRow
                    stream={stream}
                    onPlay={() => handlePlay(stream)}
                    isFav={favSet.has(stream.stream_id)}
                    onToggleFav={() => toggleFavorite(stream.stream_id)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedSeries && <SeriesDetail series={selectedSeries} onClose={() => setSelectedSeries(null)} />}
      {selectedVod && <VodDetail vod={selectedVod} onClose={() => setSelectedVod(null)} />}
    </div>
  )
}
