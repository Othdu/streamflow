import { useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store'
import { getXtreamService } from '@/services/xtream'
import type { LiveStream, VodStream, Series } from '@/types'

export default function MiniChannelStrip({ visible }: { visible: boolean }) {
  const streams = useAppStore(s => s.streams)
  const activeTab = useAppStore(s => s.activeTab)
  const playlists = useAppStore(s => s.playlists)
  const activePlaylistId = useAppStore(s => s.activePlaylistId)
  const playStream = useAppStore(s => s.playStream)
  const channelName = useAppStore(s => s.player.channelName)

  const scrollRef = useRef<HTMLDivElement>(null)
  const playlist = playlists.find(p => p.id === activePlaylistId)

  const activeIndex = useMemo(() =>
    streams.findIndex(s => s.name === channelName),
    [streams, channelName]
  )

  useEffect(() => {
    if (visible && scrollRef.current && activeIndex >= 0) {
      const child = scrollRef.current.children[activeIndex] as HTMLElement
      child?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [visible, activeIndex])

  const handlePlay = (stream: LiveStream | VodStream | Series) => {
    if (!playlist) return
    const svc = getXtreamService(playlist)
    let url = ''

    if (activeTab === 'live') {
      url = svc.getLiveStreamUrl((stream as LiveStream).stream_id)
    } else if (activeTab === 'vod') {
      const s = stream as VodStream
      url = svc.getVodStreamUrl(s.stream_id, s.container_extension || 'mp4')
    } else {
      return
    }

    const logo = activeTab === 'live'
      ? (stream as LiveStream).stream_icon
      : (stream as VodStream).stream_icon

    playStream(url, stream.name, logo)
  }

  if (!visible || streams.length === 0) return null

  return (
    <div className="absolute bottom-20 left-0 right-0 z-20 animate-slide-up">
      <div className="mx-4 backdrop-blur-xl bg-base/60 rounded-xl border border-overlay/[0.08] p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-foreground/50 text-[10px] font-medium uppercase tracking-wider">Channels</p>
          <p className="text-foreground/30 text-[10px]">{streams.length} items</p>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {streams.map((stream, i) => {
            const isLive = 'epg_channel_id' in stream
            const logo = isLive
              ? (stream as LiveStream).stream_icon
              : 'stream_icon' in stream
                ? (stream as VodStream).stream_icon
                : (stream as Series).cover
            const isActive = i === activeIndex

            return (
              <button
                key={'stream_id' in stream ? stream.stream_id : (stream as Series).series_id}
                onClick={() => handlePlay(stream)}
                className={`flex-shrink-0 w-28 rounded-lg overflow-hidden transition-all duration-200 border ${
                  isActive
                    ? 'border-accent ring-1 ring-accent/50 scale-105'
                    : 'border-overlay/[0.06] hover:border-overlay/20'
                }`}
              >
                <div className="aspect-video bg-overlay/[0.03] relative">
                  {logo ? (
                    <img src={logo} alt="" className="w-full h-full object-contain p-2" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/20 text-[10px] font-medium">
                      {stream.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                      <div className="flex gap-0.5">
                        <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse" />
                        <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                        <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-foreground/70 truncate px-1.5 py-1">{stream.name}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
