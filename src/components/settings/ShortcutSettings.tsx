const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause' },
  { key: 'F', action: 'Toggle fullscreen' },
  { key: 'M', action: 'Toggle mute' },
  { key: 'Arrow Up', action: 'Volume up' },
  { key: 'Arrow Down', action: 'Volume down' },
  { key: 'Arrow Left', action: 'Seek back 10s (VOD)' },
  { key: 'Arrow Right', action: 'Seek forward 10s (VOD)' },
  { key: 'Tab', action: 'Toggle channel strip' },
  { key: 'Escape', action: 'Exit player / fullscreen' },
  { key: 'G', action: 'Toggle TV Guide' },
  { key: 'Ctrl + ,', action: 'Open Settings' },
]

export default function ShortcutSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">Keyboard Shortcuts</h2>
      <p className="text-sm text-muted mb-8">Quick reference for all keyboard controls.</p>

      <div className="rounded-xl border border-border overflow-hidden">
        {SHORTCUTS.map((s, i) => (
          <div key={s.key} className={`flex items-center justify-between px-5 py-3.5 ${i !== 0 ? 'border-t border-border' : ''}`}>
            <span className="text-[15px] text-foreground/80">{s.action}</span>
            <kbd className="px-3 py-1.5 rounded-lg bg-overlay/[0.06] border border-overlay/10 text-xs text-secondary font-mono tracking-wide">
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}
