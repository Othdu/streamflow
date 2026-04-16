import type { EpgEntry, Playlist, LiveStream } from '@/types'
import { getXtreamService } from './xtream'

const epgCache = new Map<string, { data: EpgEntry[]; fetchedAt: number }>()
const CACHE_TTL = 30 * 60 * 1000

export async function fetchEpgForStream(
  playlist: Playlist,
  streamId: number,
  limit = 4
): Promise<EpgEntry[]> {
  const key = `${playlist.id}:${streamId}`
  const cached = epgCache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data
  }

  try {
    const svc = getXtreamService(playlist)
    const entries = await svc.getEpg(streamId, limit)
    epgCache.set(key, { data: entries, fetchedAt: Date.now() })
    return entries
  } catch {
    return []
  }
}

export function getNowNext(entries: EpgEntry[]): { now: EpgEntry | null; next: EpgEntry | null } {
  const ts = Math.floor(Date.now() / 1000)
  let now: EpgEntry | null = null
  let next: EpgEntry | null = null

  for (const e of entries) {
    if (e.start_timestamp <= ts && e.stop_timestamp > ts) {
      now = e
    } else if (e.start_timestamp > ts && !next) {
      next = e
    }
  }

  return { now, next }
}

export async function fetchBatchEpg(
  playlist: Playlist,
  streams: LiveStream[],
  limit = 4
): Promise<Map<number, EpgEntry[]>> {
  const result = new Map<number, EpgEntry[]>()
  const batchSize = 5
  for (let i = 0; i < streams.length; i += batchSize) {
    const batch = streams.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(s => fetchEpgForStream(playlist, s.stream_id, limit))
    )
    batch.forEach((s, j) => {
      const r = results[j]
      if (r.status === 'fulfilled') result.set(s.stream_id, r.value)
    })
  }
  return result
}

export function clearEpgCache() {
  epgCache.clear()
}
