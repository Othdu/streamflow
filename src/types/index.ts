// ── Playlist / Credentials ────────────────────────────────────
export interface Playlist {
  id: string
  name: string
  server: string   // e.g. http://provider.com:8080
  username: string
  password: string
  addedAt: number
}

// ── Xtream API response types ─────────────────────────────────
export interface XtreamUserInfo {
  username: string
  password: string
  message: string
  auth: number
  status: string
  exp_date: string
  is_trial: string
  active_cons: string
  created_at: string
  max_connections: string
  allowed_output_formats: string[]
}

export interface XtreamServerInfo {
  xui: boolean
  version: string
  revision: number
  url: string
  port: string
  https_port: string
  server_protocol: string
  rtmp_port: string
  timezone: string
  timestamp_now: number
  time_now: string
}

export interface XtreamAuthResponse {
  user_info: XtreamUserInfo
  server_info: XtreamServerInfo
}

export interface LiveCategory {
  category_id: string
  category_name: string
  parent_id: number
}

export interface LiveStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  epg_channel_id: string
  added: string
  category_id: string
  custom_sid: string
  tv_archive: number
  direct_source: string
  tv_archive_duration: number
}

export interface VodCategory {
  category_id: string
  category_name: string
  parent_id: number
}

export interface VodStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  rating: string
  rating_5based: number
  added: string
  category_id: string
  container_extension: string
  custom_sid: string
  direct_source: string
}

export interface SeriesCategory {
  category_id: string
  category_name: string
  parent_id: number
}

export interface Series {
  num: number
  name: string
  series_id: number
  cover: string
  plot: string
  cast: string
  director: string
  genre: string
  releaseDate: string
  last_modified: string
  rating: string
  rating_5based: number
  backdrop_path: string[]
  youtube_trailer: string
  episode_run_time: string
  category_id: string
}

export interface EpgEntry {
  id: string
  epg_id: string
  title: string
  lang: string
  start: string
  end: string
  description: string
  channel_id: string
  start_timestamp: number
  stop_timestamp: number
}

// ── Series detail types ──────────────────────────────────────
export interface Episode {
  id: string
  episode_num: number
  title: string
  container_extension: string
  info?: {
    duration?: string
    duration_secs?: number
    plot?: string
    releasedate?: string
    rating?: number
    movie_image?: string
  }
}

export interface Season {
  season_number: number
  name?: string
  episodes: Record<string, Episode>
}

export interface SeriesInfo {
  seasons: Season[]
  info: Series
  episodes: Record<string, Episode[]>
}

// ── Watch history ────────────────────────────────────────────
export interface WatchHistoryEntry {
  streamId: number
  name: string
  logo: string | null
  type: ContentTab
  timestamp: number
  progress?: number
  episodeInfo?: { seriesId: number; seasonNum: number; episodeNum: number }
}

// ── App state types ───────────────────────────────────────────
export type ContentTab = 'live' | 'vod' | 'series'
export type ViewMode = 'grid' | 'list'
export type SortOrder = 'name' | 'added' | 'watched'

export interface PlayerState {
  streamUrl: string | null
  channelName: string | null
  channelLogo: string | null
  isPlaying: boolean
  isFullscreen: boolean
  volume: number
}

// ── Theme types ──────────────────────────────────────────────
export interface ThemeColors {
  base: string
  surface: string
  card: string
  accent: string
  accentHover: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  subtle: string
  danger: string
  success: string
}

export interface ThemeEffects {
  cardRadius: string
  blur: boolean
  animations: boolean
}

export interface Theme {
  id: string
  name: string
  description: string
  preview: string
  colors: ThemeColors
  effects?: ThemeEffects
}

export type Language = 'en' | 'ar'

export interface AppSettings {
  activeThemeId: string
  accentOverride: string | null
  customCSS: string
  externalPlayerPath: string | null
  defaultStreamFormat: 'auto' | 'm3u8' | 'ts'
  bufferMode: 'low' | 'balanced' | 'smooth'
  autoPlay: boolean
  resumeVod: boolean
  minimizeToTray: boolean
  startMinimized: boolean
  language: Language
}

export interface KeyBinding {
  id: string
  label: string
  key: string
  action: string
}
