import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { useI18n } from '@/hooks/useI18n'
import type { ContentTab } from '@/types'

const TAB_ICONS: Record<ContentTab, JSX.Element> = {
  live: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><circle cx="4" cy="18" r="2"/></svg>,
  vod: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg>,
  series: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>,
}

const TAB_IDS: ContentTab[] = ['live', 'vod', 'series']

export default function Sidebar({ onOpenEpg }: { onOpenEpg?: () => void }) {
  const navigate = useNavigate()
  const playlists = useAppStore(s => s.playlists)
  const activePlaylistId = useAppStore(s => s.activePlaylistId)
  const setActivePlaylist = useAppStore(s => s.setActivePlaylist)
  const activeTab = useAppStore(s => s.activeTab)
  const setActiveTab = useAppStore(s => s.setActiveTab)
  const activeCategoryId = useAppStore(s => s.activeCategoryId)
  const setActiveCategoryId = useAppStore(s => s.setActiveCategoryId)
  const categories = useAppStore(s => s.categories)
  const categoriesLoading = useAppStore(s => s.categoriesLoading)
  const streams = useAppStore(s => s.streams)
  const collapsed = useAppStore(s => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore(s => s.setSidebarCollapsed)
  const favorites = useAppStore(s => s.favorites)
  const showFavoritesOnly = useAppStore(s => s.showFavoritesOnly)
  const setShowFavoritesOnly = useAppStore(s => s.setShowFavoritesOnly)
  const { t, isRTL } = useI18n()

  const [playlistOpen, setPlaylistOpen] = useState(false)
  const activePlaylist = playlists.find(p => p.id === activePlaylistId)

  const tabLabels: Record<ContentTab, string> = {
    live: t('tab.live'),
    vod: t('tab.movies'),
    series: t('tab.series'),
  }

  const favCount = streams.filter(s => {
    const id = 'stream_id' in s ? s.stream_id : (s as any).series_id
    return favorites.includes(id)
  }).length

  const getCategoryCount = (catId: string) =>
    streams.filter(s => ('category_id' in s ? s.category_id : '') === catId).length

  if (collapsed) {
    return (
      <aside className={`sidebar w-[56px] h-full bg-surface flex flex-col items-center shrink-0 ${isRTL() ? 'border-l' : 'border-r'} border-overlay/[0.04]`}>
        <div className="flex flex-col items-center gap-1 pt-4 w-full px-2">
          {TAB_IDS.map(id => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarCollapsed(false) }}
              className={`sidebar-item tab-item w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${activeTab === id ? 'active' : ''} ${
                activeTab === id ? 'text-foreground bg-gradient-to-br from-accent/20 to-accent-hover/10 shadow-inner shadow-accent/5' : 'text-foreground/25 hover:text-foreground/50 hover:bg-overlay/[0.04]'
              }`}
              title={tabLabels[id]}
            >
              {activeTab === id && <span className={`absolute ${isRTL() ? 'right-0' : 'left-0'} top-2 bottom-2 w-[3px] ${isRTL() ? 'rounded-l-full' : 'rounded-r-full'} bg-gradient-to-b from-accent to-accent-hover`} />}
              {TAB_ICONS[id]}
            </button>
          ))}
        </div>
        <div className="mt-auto pb-3 flex flex-col items-center gap-1">
          <button onClick={() => navigate('/settings')} className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground/20 hover:text-foreground/50 hover:bg-overlay/[0.05] transition-colors" title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button onClick={() => setSidebarCollapsed(false)} className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground/20 hover:text-foreground/50 hover:bg-overlay/[0.05] transition-colors" title="Expand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className={`sidebar w-[260px] h-full flex flex-col shrink-0 ${isRTL() ? 'border-l' : 'border-r'} border-overlay/[0.04] relative overflow-hidden`}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-surface" />
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-accent/[0.04] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-accent-hover/[0.02] to-transparent" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Playlist selector */}
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <button
              onClick={() => playlists.length > 1 && setPlaylistOpen(!playlistOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-overlay/[0.04] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/25 to-accent-hover/15 flex items-center justify-center shrink-0 ring-1 ring-accent/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[13px] text-foreground font-semibold truncate leading-tight">{activePlaylist?.name ?? t('sidebar.noPlaylist')}</p>
                <p className="text-[10px] text-foreground/25 leading-tight mt-0.5">{t('sidebar.xtream')}</p>
              </div>
              {playlists.length > 1 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-foreground/20 shrink-0 transition-transform ${playlistOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
              )}
            </button>

            {playlistOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPlaylistOpen(false)} />
                <div className="absolute top-full mt-1 left-2 right-2 bg-card border border-overlay/[0.08] rounded-xl shadow-2xl shadow-base/50 z-20 py-1.5 animate-fade-in">
                  {playlists.map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => { setActivePlaylist(pl.id); setPlaylistOpen(false) }}
                      className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors ${
                        pl.id === activePlaylistId ? 'text-accent font-medium' : 'text-foreground/50 hover:text-foreground hover:bg-overlay/[0.04]'
                      }`}
                    >
                      {pl.name}
                    </button>
                  ))}
                  <div className="h-px bg-overlay/[0.06] mx-3 my-1" />
                  <button
                    onClick={() => { setPlaylistOpen(false); navigate('/login') }}
                    className="w-full text-left px-3.5 py-2 text-[13px] text-foreground/30 hover:text-foreground hover:bg-overlay/[0.04] transition-colors flex items-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    {t('sidebar.addPlaylist')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs — pill style */}
        <div className="px-3 pb-2">
          <div className="flex gap-1 bg-overlay/[0.03] rounded-xl p-1 border border-overlay/[0.03]">
            {TAB_IDS.map(id => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`sidebar-item tab-item flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all relative ${activeTab === id ? 'active' : ''} ${
                  activeTab === id
                    ? 'bg-gradient-to-br from-accent/25 to-accent/15 text-accent-hover shadow-sm shadow-accent/10 ring-1 ring-accent/20'
                    : 'text-foreground/30 hover:text-foreground/50 hover:bg-overlay/[0.03]'
                }`}
              >
                <span className={`scale-[0.75] ${activeTab === id ? 'text-accent-hover' : 'opacity-50'}`}>{TAB_ICONS[id]}</span>
                {tabLabels[id]}
              </button>
            ))}
          </div>
        </div>

        {/* TV Guide */}
        {onOpenEpg && activeTab === 'live' && (
          <div className="px-3 pt-0.5 pb-1">
            <button
              onClick={onOpenEpg}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-foreground/30 hover:text-accent-hover hover:bg-accent/[0.06] transition-all group"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="group-hover:text-accent transition-colors"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>
              <span>{t('sidebar.tvGuide')}</span>
              <span className="ml-auto text-[9px] text-foreground/15 bg-overlay/[0.04] px-1.5 py-0.5 rounded font-mono">G</span>
            </button>
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-overlay/[0.06] to-transparent mx-5 my-1" />

        {/* Categories header */}
        <div className="px-3 pt-2 pb-1 flex items-center">
          <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-[0.15em] px-3">{t('sidebar.categories')}</p>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`sidebar-item w-full text-left px-3 py-2 rounded-lg text-[12px] transition-all mb-0.5 flex items-center gap-2.5 relative ${showFavoritesOnly ? 'active' : ''} ${
              showFavoritesOnly
                ? 'text-accent-hover bg-accent/10 font-medium ring-1 ring-accent/15'
                : 'text-foreground/40 hover:text-foreground/70 hover:bg-overlay/[0.04]'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {t('sidebar.favorites')}
            {favCount > 0 && (
              <span className="ml-auto text-[10px] text-foreground/20 bg-overlay/[0.05] px-1.5 py-0.5 rounded-md font-mono">{favCount}</span>
            )}
          </button>

          <button
            onClick={() => { setActiveCategoryId(null); setShowFavoritesOnly(false) }}
            className={`sidebar-item w-full text-left px-3 py-2 rounded-lg text-[12px] transition-all mb-0.5 relative ${activeCategoryId === null && !showFavoritesOnly ? 'active' : ''} ${
              activeCategoryId === null && !showFavoritesOnly
                ? 'text-foreground font-semibold bg-overlay/[0.06]'
                : 'text-foreground/40 hover:text-foreground/70 hover:bg-overlay/[0.04]'
            }`}
          >
            {activeTab === 'live' ? t('sidebar.allChannels') : activeTab === 'vod' ? t('sidebar.allMovies') : t('sidebar.allSeries')}
          </button>

          {categoriesLoading && (
            <div className="space-y-1 pt-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-[32px] rounded-lg shimmer-bg animate-shimmer" style={{ width: `${55 + ((i * 23) % 40)}%`, opacity: 1 - i * 0.06 }} />
              ))}
            </div>
          )}

          {!categoriesLoading && categories.map(cat => {
            const count = getCategoryCount(cat.category_id)
            const isActive = activeCategoryId === cat.category_id && !showFavoritesOnly
            return (
              <button
                key={cat.category_id}
                onClick={() => { setActiveCategoryId(cat.category_id); setShowFavoritesOnly(false) }}
                className={`sidebar-item w-full text-left px-3 py-[7px] rounded-lg text-[12px] transition-all truncate mb-px flex items-center relative ${isActive ? 'active' : ''} ${
                  isActive
                    ? 'text-foreground font-semibold bg-overlay/[0.06]'
                    : 'text-foreground/35 hover:text-foreground/60 hover:bg-overlay/[0.03]'
                }`}
              >
                <span className="truncate flex-1">{cat.category_name}</span>
                {count > 0 && (
                  <span className={`ml-2 text-[10px] shrink-0 font-mono ${isActive ? 'text-foreground/30' : 'text-foreground/15'}`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-3 py-2.5 border-t border-overlay/[0.04] flex items-center gap-1 bg-base/20">
          <button onClick={() => setSidebarCollapsed(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-foreground/20 hover:text-foreground/40 text-[11px] hover:bg-overlay/[0.04] transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={isRTL() ? 'rotate-180' : ''}><polyline points="15 18 9 12 15 6"/></svg>
            {t('sidebar.collapse')}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/20 hover:text-foreground/50 hover:bg-overlay/[0.05] transition-colors"
            title="Settings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/20 hover:text-foreground/50 hover:bg-overlay/[0.05] transition-colors"
            title="Add playlist"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
