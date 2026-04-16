import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store'
import { getXtreamService } from '@/services/xtream'
import { fetchEpgForStream, getNowNext } from '@/services/epg'
import type { LiveStream, EpgEntry, Playlist } from '@/types'

const HOUR_WIDTH = 240
const ROW_HEIGHT = 56
const HOURS_VISIBLE = 6

function timeLabel(ts: number): string {
  const d = new Date(ts * 1000)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ProgramBlock({ entry, startHour, now, hasCatchUp, onCatchUp }: {
  entry: EpgEntry; startHour: number; now: number; hasCatchUp?: boolean; onCatchUp?: () => void
}) {
  const left = ((entry.start_timestamp - startHour) / 3600) * HOUR_WIDTH
  const width = Math.max(30, ((entry.stop_timestamp - entry.start_timestamp) / 3600) * HOUR_WIDTH)
  const isCurrent = entry.start_timestamp <= now && entry.stop_timestamp > now
  const isPast = entry.stop_timestamp <= now
  const canCatchUp = isPast && hasCatchUp

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center overflow-hidden border transition-colors ${
        isCurrent
          ? 'bg-accent/20 border-accent/40 text-foreground cursor-default'
          : canCatchUp
            ? 'bg-amber-500/[0.06] border-amber-500/20 text-amber-300/70 hover:bg-amber-500/[0.12] cursor-pointer'
            : isPast
              ? 'bg-overlay/[0.02] border-overlay/[0.03] text-muted/50 cursor-default'
              : 'bg-overlay/[0.04] border-overlay/[0.06] text-foreground/70 hover:bg-overlay/[0.07] cursor-default'
      }`}
      style={{ left: `${left}px`, width: `${width}px` }}
      title={`${entry.title}\n${timeLabel(entry.start_timestamp)} - ${timeLabel(entry.stop_timestamp)}${canCatchUp ? '\nClick to watch catch-up' : ''}${entry.description ? '\n' + entry.description : ''}`}
      onClick={canCatchUp ? onCatchUp : undefined}
    >
      <p className="text-[11px] truncate font-medium">{entry.title}</p>
      {isCurrent && (
        <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      )}
      {canCatchUp && (
        <span className="ml-auto shrink-0 text-[8px] font-bold text-amber-400">▶</span>
      )}
    </div>
  )
}

export default function EpgGuide({ onClose }: { onClose: () => void }) {
  const playlists = useAppStore(s => s.playlists)
  const activePlaylistId = useAppStore(s => s.activePlaylistId)
  const playStream = useAppStore(s => s.playStream)
  const playlist = playlists.find(p => p.id === activePlaylistId)

  const [channels, setChannels] = useState<LiveStream[]>([])
  const [epgData, setEpgData] = useState<Map<number, EpgEntry[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000)
    return () => clearInterval(timer)
  }, [])
  const startHour = useMemo(() => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() - 1)
    return Math.floor(d.getTime() / 1000)
  }, [])

  useEffect(() => {
    if (!playlist) return
    setLoading(true)
    const svc = getXtreamService(playlist)
    svc.getLiveStreams().then(async streams => {
      const limited = streams.slice(0, 100)
      setChannels(limited)

      const epg = new Map<number, EpgEntry[]>()
      const batchSize = 10
      for (let i = 0; i < limited.length; i += batchSize) {
        const batch = limited.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map(s => fetchEpgForStream(playlist, s.stream_id, 8))
        )
        batch.forEach((s, j) => {
          const r = results[j]
          if (r.status === 'fulfilled') epg.set(s.stream_id, r.value)
        })
        setEpgData(new Map(epg))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [playlist])

  useEffect(() => {
    if (scrollRef.current) {
      const nowOffset = ((now - startHour) / 3600) * HOUR_WIDTH - 200
      scrollRef.current.scrollLeft = Math.max(0, nowOffset)
    }
  }, [loading])

  const handlePlay = (stream: LiveStream) => {
    if (!playlist) return
    const svc = getXtreamService(playlist)
    const url = svc.getLiveStreamUrl(stream.stream_id)
    playStream(url, stream.name, stream.stream_icon, stream.stream_id)
    onClose()
  }

  const handleCatchUp = useCallback((stream: LiveStream, entry: EpgEntry) => {
    if (!playlist) return
    const svc = getXtreamService(playlist)
    const durationMins = Math.ceil((entry.stop_timestamp - entry.start_timestamp) / 60)
    const startDate = new Date(entry.start_timestamp * 1000)
    const url = svc.getTimeshiftUrl(stream.stream_id, startDate, durationMins)
    playStream(url, `${stream.name} - ${entry.title} (Catch-up)`, stream.stream_icon, stream.stream_id)
    onClose()
  }, [playlist, playStream, onClose])

  const timeSlots = Array.from({ length: HOURS_VISIBLE + 2 }, (_, i) => startHour + i * 3600)

  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col">
      {/* Header */}
      <div className="h-12 flex items-center px-5 border-b border-border bg-surface shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-overlay/[0.05] hover:bg-overlay/10 flex items-center justify-center transition-colors mr-3"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-[14px] font-semibold text-foreground">TV Guide</h1>
        <p className="text-[11px] text-muted ml-3">{channels.length} channels</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Channel column */}
        <div className="w-48 shrink-0 border-r border-border overflow-y-auto bg-surface" style={{ scrollbarWidth: 'none' }}>
          <div className="h-8 border-b border-border" />
          {channels.map(ch => (
            <div
              key={ch.stream_id}
              className="h-14 flex items-center gap-2 px-3 border-b border-overlay/[0.03] cursor-pointer hover:bg-overlay/[0.03] transition-colors"
              onClick={() => handlePlay(ch)}
            >
              <div className="w-7 h-7 rounded bg-subtle shrink-0 overflow-hidden flex items-center justify-center">
                {ch.stream_icon ? (
                  <img src={ch.stream_icon} alt="" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <span className="text-[9px] text-muted/40 font-bold">{ch.name.charAt(0)}</span>
                )}
              </div>
              <p className="text-[11px] text-foreground/80 truncate">{ch.name}</p>
            </div>
          ))}
        </div>

        {/* Timeline grid */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          {/* Time header */}
          <div className="sticky top-0 z-10 h-8 bg-surface border-b border-border flex" style={{ width: `${(HOURS_VISIBLE + 2) * HOUR_WIDTH}px` }}>
            {timeSlots.map(ts => (
              <div key={ts} className="flex items-center px-2 text-[10px] text-muted border-l border-overlay/[0.04]" style={{ width: `${HOUR_WIDTH}px` }}>
                {timeLabel(ts)}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="relative" style={{ width: `${(HOURS_VISIBLE + 2) * HOUR_WIDTH}px` }}>
            {/* Now indicator */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-20"
              style={{ left: `${((now - startHour) / 3600) * HOUR_WIDTH}px` }}
            >
              <div className="absolute -top-0.5 -left-1 w-2 h-2 rounded-full bg-red-500" />
            </div>

            {channels.map(ch => {
              const entries = epgData.get(ch.stream_id) ?? []
              const hasCatchUp = ch.tv_archive === 1
              return (
                <div key={ch.stream_id} className="relative border-b border-overlay/[0.03]" style={{ height: `${ROW_HEIGHT}px` }}>
                  {entries.map(entry => (
                    <ProgramBlock
                      key={entry.id || `${entry.start_timestamp}`}
                      entry={entry}
                      startHour={startHour}
                      now={now}
                      hasCatchUp={hasCatchUp}
                      onCatchUp={() => handleCatchUp(ch, entry)}
                    />
                  ))}
                </div>
              )
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-muted text-[11px] ml-2">Loading EPG data...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
