import { useState, useRef, useEffect } from 'react'
import type Hls from 'hls.js'

interface QualityLevel {
  index: number
  height: number
  width: number
  bitrate: number
  label: string
}

export default function QualitySelector({ hls }: { hls: Hls | null }) {
  const [open, setOpen] = useState(false)
  const [levels, setLevels] = useState<QualityLevel[]>([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hls) { setLevels([]); return }

    const updateLevels = () => {
      const hlsLevels = hls.levels.map((l, i) => ({
        index: i,
        height: l.height,
        width: l.width,
        bitrate: l.bitrate,
        label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}k`,
      }))
      setLevels(hlsLevels)
      setCurrentLevel(hls.currentLevel)
    }

    hls.on('hlsLevelSwitched' as any, () => setCurrentLevel(hls.currentLevel))
    hls.on('hlsManifestParsed' as any, updateLevels)

    if (hls.levels.length > 0) updateLevels()
  }, [hls])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectLevel = (index: number) => {
    if (hls) {
      hls.currentLevel = index
      setCurrentLevel(index)
    }
    setOpen(false)
  }

  if (levels.length <= 1) return null

  const currentLabel = currentLevel === -1 ? 'Auto' : levels[currentLevel]?.label ?? 'Auto'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="h-8 px-2.5 rounded-lg bg-overlay/10 hover:bg-overlay/20 flex items-center gap-1.5 transition-colors"
        title="Quality"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span className="text-foreground text-[11px] font-medium">{currentLabel}</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-36 backdrop-blur-xl bg-base/80 border border-overlay/10 rounded-lg overflow-hidden shadow-2xl">
          <button
            onClick={() => selectLevel(-1)}
            className={`w-full px-3 py-2 text-left text-[12px] flex items-center justify-between transition-colors ${
              currentLevel === -1 ? 'text-accent bg-accent/10' : 'text-foreground/80 hover:bg-overlay/10'
            }`}
          >
            Auto
            {currentLevel === -1 && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>
          {levels
            .sort((a, b) => b.height - a.height)
            .map(level => (
              <button
                key={level.index}
                onClick={() => selectLevel(level.index)}
                className={`w-full px-3 py-2 text-left text-[12px] flex items-center justify-between transition-colors ${
                  currentLevel === level.index ? 'text-accent bg-accent/10' : 'text-foreground/80 hover:bg-overlay/10'
                }`}
              >
                {level.label}
                {currentLevel === level.index && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
