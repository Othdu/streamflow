import { create } from 'zustand'
import type {
  Playlist, PlayerState, ContentTab, ViewMode, SortOrder,
  LiveCategory, LiveStream, VodCategory, VodStream,
  SeriesCategory, Series, WatchHistoryEntry, AppSettings,
} from '@/types'
import { persistentStore } from '@/services/storage'
import { getXtreamService } from '@/services/xtream'

export type AnyCategory = LiveCategory | VodCategory | SeriesCategory
export type AnyStream = LiveStream | VodStream | Series

const catCache = new Map<string, AnyCategory[]>()
const streamCache = new Map<string, AnyStream[]>()
const cKey = (pid: string, tab: ContentTab) => `${pid}:${tab}`
const sKey = (pid: string, tab: ContentTab, cid: string | null) => `${pid}:${tab}:${cid ?? '*'}`

const DEFAULT_SETTINGS: AppSettings = {
  activeThemeId: 'streamflow-dark',
  accentOverride: null,
  customCSS: '',
  externalPlayerPath: null,
  defaultStreamFormat: 'auto',
  bufferMode: 'balanced',
  autoPlay: true,
  resumeVod: true,
  alwaysShowResumePrompt: false,
  minimizeToTray: false,
  startMinimized: false,
  language: 'en',
}

interface AppStore {
  playlists: Playlist[]
  activePlaylistId: string | null
  playlistsLoaded: boolean
  addPlaylist: (playlist: Playlist) => Promise<void>
  updatePlaylist: (id: string, updates: Partial<Omit<Playlist, 'id' | 'addedAt'>>) => Promise<void>
  removePlaylist: (id: string) => Promise<void>
  setActivePlaylist: (id: string) => void
  loadPlaylists: () => Promise<void>

  activeTab: ContentTab
  setActiveTab: (tab: ContentTab) => void
  activeCategoryId: string | null
  setActiveCategoryId: (id: string | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void

  categories: AnyCategory[]
  streams: AnyStream[]
  categoriesLoading: boolean
  streamsLoading: boolean
  dataError: string | null
  fetchCategories: () => Promise<void>
  fetchStreams: () => Promise<void>

  player: PlayerState
  playStream: (
    url: string,
    name: string,
    logo?: string,
    streamId?: number,
    episodeInfo?: WatchHistoryEntry['episodeInfo'],
  ) => void
  stopStream: () => void
  setVolume: (v: number) => void
  setFullscreen: (v: boolean) => void

  favorites: number[]
  toggleFavorite: (streamId: number) => Promise<void>
  loadFavorites: () => Promise<void>
  showFavoritesOnly: boolean
  setShowFavoritesOnly: (v: boolean) => void

  watchHistory: WatchHistoryEntry[]
  addToHistory: (entry: Omit<WatchHistoryEntry, 'timestamp'>) => Promise<void>
  removeFromHistory: (streamId: number) => Promise<void>
  loadWatchHistory: () => Promise<void>
  clearWatchHistory: () => Promise<void>

  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  loadSettings: () => Promise<void>
}

const DEFAULT_PLAYER: PlayerState = {
  streamUrl: null,
  channelName: null,
  channelLogo: null,
  streamId: null,
  episodeInfo: null,
  isPlaying: false,
  isFullscreen: false,
  volume: 80,
}

export const useAppStore = create<AppStore>((set, get) => ({
  playlists: [],
  activePlaylistId: null,
  playlistsLoaded: false,

  addPlaylist: async (playlist) => {
    const updated = [...get().playlists, playlist]
    set({ playlists: updated })
    await persistentStore.set('playlists', updated)
    if (!get().activePlaylistId) {
      set({ activePlaylistId: playlist.id })
      await persistentStore.set('activePlaylistId', playlist.id)
    }
    get().fetchCategories()
    get().fetchStreams()
  },

  updatePlaylist: async (id, updates) => {
    const playlists = get().playlists.map(p => p.id === id ? { ...p, ...updates } : p)
    set({ playlists })
    await persistentStore.set('playlists', playlists)
  },

  removePlaylist: async (id) => {
    const updated = get().playlists.filter(p => p.id !== id)
    set({ playlists: updated })
    await persistentStore.set('playlists', updated)
    if (get().activePlaylistId === id) {
      const next = updated[0]?.id ?? null
      set({ activePlaylistId: next })
      await persistentStore.set('activePlaylistId', next)
      if (next) {
        get().fetchCategories()
        get().fetchStreams()
      }
    }
  },

  setActivePlaylist: (id) => {
    set({ activePlaylistId: id, activeCategoryId: null, categories: [], streams: [] })
    persistentStore.set('activePlaylistId', id)
    get().fetchCategories()
    get().fetchStreams()
  },

  loadPlaylists: async () => {
    const playlists = await persistentStore.get<Playlist[]>('playlists') ?? []
    const activePlaylistId = await persistentStore.get<string>('activePlaylistId') ?? null
    set({ playlists, activePlaylistId, playlistsLoaded: true })
    if (activePlaylistId) {
      get().fetchCategories()
      get().fetchStreams()
    }
  },

  activeTab: 'live',
  setActiveTab: (tab) => {
    set({ activeTab: tab, activeCategoryId: null, searchQuery: '', streams: [], showFavoritesOnly: false })
    get().fetchCategories()
    get().fetchStreams()
  },
  activeCategoryId: null,
  setActiveCategoryId: (id) => {
    set({ activeCategoryId: id, showFavoritesOnly: false })
    get().fetchStreams()
  },
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
  sortOrder: 'name',
  setSortOrder: (order) => set({ sortOrder: order }),

  categories: [],
  streams: [],
  categoriesLoading: false,
  streamsLoading: false,
  dataError: null,

  fetchCategories: async () => {
    const { activePlaylistId, activeTab, playlists } = get()
    const playlist = playlists.find(p => p.id === activePlaylistId)
    if (!playlist) return

    const key = cKey(playlist.id, activeTab)
    const cached = catCache.get(key)
    if (cached) {
      set({ categories: cached, categoriesLoading: false })
      return
    }

    set({ categoriesLoading: true, dataError: null })
    try {
      const svc = getXtreamService(playlist)
      let cats: AnyCategory[] = []
      if (activeTab === 'live') cats = await svc.getLiveCategories()
      else if (activeTab === 'vod') cats = await svc.getVodCategories()
      else cats = await svc.getSeriesCategories()
      catCache.set(key, cats)
      if (get().activePlaylistId === playlist.id && get().activeTab === activeTab) {
        set({ categories: cats, categoriesLoading: false })
      }
    } catch (e: any) {
      if (get().activePlaylistId === playlist.id && get().activeTab === activeTab) {
        set({ dataError: e.message ?? 'Failed to load categories', categoriesLoading: false })
      }
    }
  },

  fetchStreams: async () => {
    const { activePlaylistId, activeTab, activeCategoryId, playlists } = get()
    const playlist = playlists.find(p => p.id === activePlaylistId)
    if (!playlist) return

    const key = sKey(playlist.id, activeTab, activeCategoryId)
    const cached = streamCache.get(key)
    if (cached) {
      set({ streams: cached, streamsLoading: false })
      return
    }

    set({ streamsLoading: true })
    try {
      const svc = getXtreamService(playlist)
      const catId = activeCategoryId ?? undefined
      let items: AnyStream[] = []
      if (activeTab === 'live') items = await svc.getLiveStreams(catId)
      else if (activeTab === 'vod') items = await svc.getVodStreams(catId)
      else items = await svc.getSeries(catId)
      streamCache.set(key, items)
      if (get().activePlaylistId === playlist.id && get().activeTab === activeTab && get().activeCategoryId === activeCategoryId) {
        set({ streams: items, streamsLoading: false })
      }
    } catch (e: any) {
      if (get().activePlaylistId === playlist.id && get().activeTab === activeTab) {
        set({ dataError: e.message ?? 'Failed to load streams', streamsLoading: false })
      }
    }
  },

  player: DEFAULT_PLAYER,

  playStream: (url, name, logo, streamId, episodeInfo) => {
    let resolvedId: number | null = streamId ?? null
    if (resolvedId == null) {
      const found = get().streams.find(s => s.name === name)
      if (found) {
        resolvedId = 'stream_id' in found ? found.stream_id : (found as Series).series_id
      }
    }
    set({
      player: {
        ...get().player,
        streamUrl: url,
        channelName: name,
        channelLogo: logo ?? null,
        isPlaying: true,
        streamId: resolvedId,
        episodeInfo: episodeInfo ?? null,
      },
    })
    if (resolvedId != null) {
      get().addToHistory({
        streamId: resolvedId,
        name,
        logo: logo ?? null,
        type: get().activeTab,
        ...(episodeInfo ? { episodeInfo } : {}),
      })
    }
  },

  stopStream: () => {
    const vol = get().player.volume
    set({ player: { ...DEFAULT_PLAYER, volume: vol } })
  },

  setVolume: (volume) => set({ player: { ...get().player, volume } }),
  setFullscreen: (isFullscreen) => set({ player: { ...get().player, isFullscreen } }),

  favorites: [],
  showFavoritesOnly: false,
  setShowFavoritesOnly: (v) => set({ showFavoritesOnly: v }),

  toggleFavorite: async (streamId) => {
    const favs = get().favorites
    const updated = favs.includes(streamId)
      ? favs.filter(id => id !== streamId)
      : [...favs, streamId]
    set({ favorites: updated })
    await persistentStore.set('favorites', updated)
  },

  loadFavorites: async () => {
    const favorites = await persistentStore.get<number[]>('favorites') ?? []
    set({ favorites })
  },

  watchHistory: [],

  addToHistory: async (entry) => {
    const existing = get().watchHistory.find(h => h.streamId === entry.streamId)
    const history = get().watchHistory.filter(h => h.streamId !== entry.streamId)
    const merged = { ...existing, ...entry, timestamp: Date.now() }
    const updated = [merged, ...history].slice(0, 100)
    set({ watchHistory: updated })
    await persistentStore.set('watchHistory', updated)
  },

  removeFromHistory: async (streamId) => {
    const updated = get().watchHistory.filter(h => h.streamId !== streamId)
    set({ watchHistory: updated })
    await persistentStore.set('watchHistory', updated)
  },

  loadWatchHistory: async () => {
    const watchHistory = await persistentStore.get<WatchHistoryEntry[]>('watchHistory') ?? []
    set({ watchHistory })
  },

  clearWatchHistory: async () => {
    set({ watchHistory: [] })
    await persistentStore.set('watchHistory', [])
  },

  settings: DEFAULT_SETTINGS,

  updateSettings: async (partial) => {
    const updated = { ...get().settings, ...partial }
    set({ settings: updated })
    await persistentStore.set('settings', updated)
  },

  loadSettings: async () => {
    const saved = await persistentStore.get<AppSettings>('settings')
    if (saved) set({ settings: { ...DEFAULT_SETTINGS, ...saved } })
  },
}))
