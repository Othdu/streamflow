import axios, { AxiosInstance } from 'axios'
import type {
  XtreamAuthResponse,
  LiveCategory,
  LiveStream,
  VodCategory,
  VodStream,
  SeriesCategory,
  Series,
  SeriesInfo,
  EpgEntry,
  Playlist,
} from '@/types'

export class XtreamService {
  private client: AxiosInstance
  private server: string
  private username: string
  private password: string

  constructor(playlist: Playlist) {
    this.server   = playlist.server.replace(/\/$/, '')
    this.username = playlist.username
    this.password = playlist.password

    this.client = axios.create({
      baseURL: this.server,
      timeout: 15000,
    })
  }

  // ── Auth ────────────────────────────────────────────────────
  async authenticate(): Promise<XtreamAuthResponse> {
    const { data } = await this.client.get('/player_api.php', {
      params: { username: this.username, password: this.password },
    })
    if (!data.user_info || data.user_info.auth === 0) {
      throw new Error('Invalid credentials')
    }
    return data as XtreamAuthResponse
  }

  // ── Live TV ─────────────────────────────────────────────────
  async getLiveCategories(): Promise<LiveCategory[]> {
    const { data } = await this.client.get('/player_api.php', {
      params: {
        username: this.username,
        password: this.password,
        action: 'get_live_categories',
      },
    })
    return data as LiveCategory[]
  }

  async getLiveStreams(categoryId?: string): Promise<LiveStream[]> {
    const params: Record<string, string> = {
      username: this.username,
      password: this.password,
      action: 'get_live_streams',
    }
    if (categoryId) params.category_id = categoryId
    const { data } = await this.client.get('/player_api.php', { params })
    return data as LiveStream[]
  }

  // ── VOD ─────────────────────────────────────────────────────
  async getVodCategories(): Promise<VodCategory[]> {
    const { data } = await this.client.get('/player_api.php', {
      params: {
        username: this.username,
        password: this.password,
        action: 'get_vod_categories',
      },
    })
    return data as VodCategory[]
  }

  async getVodStreams(categoryId?: string): Promise<VodStream[]> {
    const params: Record<string, string> = {
      username: this.username,
      password: this.password,
      action: 'get_vod_streams',
    }
    if (categoryId) params.category_id = categoryId
    const { data } = await this.client.get('/player_api.php', { params })
    return data as VodStream[]
  }

  // ── Series ──────────────────────────────────────────────────
  async getSeriesCategories(): Promise<SeriesCategory[]> {
    const { data } = await this.client.get('/player_api.php', {
      params: {
        username: this.username,
        password: this.password,
        action: 'get_series_categories',
      },
    })
    return data as SeriesCategory[]
  }

  async getSeries(categoryId?: string): Promise<Series[]> {
    const params: Record<string, string> = {
      username: this.username,
      password: this.password,
      action: 'get_series',
    }
    if (categoryId) params.category_id = categoryId
    const { data } = await this.client.get('/player_api.php', { params })
    return data as Series[]
  }

  // ── Series info ────────────────────────────────────────────
  async getSeriesInfo(seriesId: number): Promise<SeriesInfo> {
    const { data } = await this.client.get('/player_api.php', {
      params: {
        username: this.username,
        password: this.password,
        action: 'get_series_info',
        series_id: seriesId,
      },
    })
    return data as SeriesInfo
  }

  // ── VOD Info ────────────────────────────────────────────────
  async getVodInfo(vodId: number): Promise<any> {
    const { data } = await this.client.get('/player_api.php', {
      params: {
        username: this.username,
        password: this.password,
        action: 'get_vod_info',
        vod_id: vodId,
      },
    })
    return data
  }

  // ── EPG ─────────────────────────────────────────────────────
  async getEpg(streamId: number, limit = 4): Promise<EpgEntry[]> {
    const { data } = await this.client.get('/player_api.php', {
      params: {
        username: this.username,
        password: this.password,
        action: 'get_short_epg',
        stream_id: streamId,
        limit,
      },
    })
    return data?.epg_listings ?? []
  }

  // ── Stream URL builders ──────────────────────────────────────
  getLiveStreamUrl(streamId: number, ext = 'm3u8'): string {
    return `${this.server}/live/${this.username}/${this.password}/${streamId}.${ext}`
  }

  getVodStreamUrl(streamId: number, ext: string): string {
    return `${this.server}/movie/${this.username}/${this.password}/${streamId}.${ext}`
  }

  getSeriesStreamUrl(streamId: number, ext: string): string {
    return `${this.server}/series/${this.username}/${this.password}/${streamId}.${ext}`
  }

  getTimeshiftUrl(streamId: number, start: Date, durationMinutes: number): string {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}:${pad(start.getHours())}-${pad(start.getMinutes())}`
    return `${this.server}/timeshift/${this.username}/${this.password}/${durationMinutes}/${startStr}/${streamId}.ts`
  }
}

// ── Singleton cache per playlist id ──────────────────────────
const cache = new Map<string, XtreamService>()

export function getXtreamService(playlist: Playlist): XtreamService {
  if (!cache.has(playlist.id)) {
    cache.set(playlist.id, new XtreamService(playlist))
  }
  return cache.get(playlist.id)!
}

export function clearXtreamCache(playlistId?: string) {
  if (playlistId) cache.delete(playlistId)
  else cache.clear()
}
