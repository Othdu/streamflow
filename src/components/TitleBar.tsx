const isElectron = typeof window !== 'undefined' && 'electron' in window

export default function TitleBar() {
  const minimize = () => isElectron && (window as any).electron.window.minimize()
  const maximize = () => isElectron && (window as any).electron.window.maximize()
  const close    = () => isElectron && (window as any).electron.window.close()

  return (
    <div
      className="fixed top-0 left-0 right-0 h-10 flex items-center z-50 select-none bg-base/80 backdrop-blur-xl border-b border-border"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-accent-hover opacity-70" />

      <div className="flex items-center gap-2.5 pl-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center shadow-sm shadow-accent/20">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="text-foreground"><polygon points="6 3 20 12 6 21 6 3"/></svg>
        </div>
        <span className="text-[11px] font-semibold text-foreground/50 tracking-wide">STREAMFLOW</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={minimize} className="w-[46px] h-10 flex items-center justify-center hover:bg-overlay/[0.06] transition-colors">
          <svg width="10" height="1" viewBox="0 0 10 1"><line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1" className="text-foreground/30"/></svg>
        </button>
        <button onClick={maximize} className="w-[46px] h-10 flex items-center justify-center hover:bg-overlay/[0.06] transition-colors">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none" className="text-foreground/30"/></svg>
        </button>
        <button onClick={close} className="w-[46px] h-10 flex items-center justify-center hover:bg-[#e81123] transition-colors group">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1" className="text-foreground/30 group-hover:text-foreground"/></svg>
        </button>
      </div>
    </div>
  )
}
