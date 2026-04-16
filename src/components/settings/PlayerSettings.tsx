import { useAppStore } from '@/store'

declare global {
  interface Window {
    electron?: {
      store: { get: (k: string) => Promise<any>; set: (k: string, v: any) => Promise<void>; delete: (k: string) => Promise<void> }
      window: { minimize: () => void; maximize: () => void; close: () => void }
      player: { launchExternal: (url: string, playerPath?: string) => Promise<{ success: boolean; error?: string }> }
      dialog: { openFile: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }> }
    }
  }
}

export default function PlayerSettings() {
  const settings = useAppStore(s => s.settings)
  const updateSettings = useAppStore(s => s.updateSettings)

  const browsePlayer = async () => {
    if (!window.electron?.dialog) return
    const result = await window.electron.dialog.openFile({
      title: 'Select External Player',
      filters: [{ name: 'Executables', extensions: ['exe', 'app', ''] }],
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      updateSettings({ externalPlayerPath: result.filePaths[0] })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">Player</h2>
      <p className="text-sm text-muted mb-8">Configure video playback preferences.</p>

      <div className="space-y-2">
        <div className="py-4 border-b border-border">
          <p className="text-[15px] text-foreground font-medium mb-2">Default stream format</p>
          <p className="text-sm text-muted mb-3">Some servers work better with specific formats</p>
          <div className="flex gap-2">
            {(['auto', 'm3u8', 'ts'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => updateSettings({ defaultStreamFormat: fmt })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.defaultStreamFormat === fmt
                    ? 'bg-accent text-foreground'
                    : 'bg-overlay/[0.05] text-secondary hover:text-foreground hover:bg-overlay/[0.08]'
                }`}
              >
                {fmt === 'auto' ? 'Auto' : fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="py-4 border-b border-border">
          <p className="text-[15px] text-foreground font-medium mb-2">Buffer mode</p>
          <p className="text-sm text-muted mb-3">Balance between latency and smooth playback</p>
          <div className="flex gap-2">
            {(['low', 'balanced', 'smooth'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => updateSettings({ bufferMode: mode })}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  settings.bufferMode === mode
                    ? 'bg-accent text-foreground'
                    : 'bg-overlay/[0.05] text-secondary hover:text-foreground hover:bg-overlay/[0.08]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-border">
          <div>
            <p className="text-[15px] text-foreground font-medium">Auto-play on channel click</p>
            <p className="text-sm text-muted mt-1">Start playback immediately when selecting a channel</p>
          </div>
          <button
            onClick={() => updateSettings({ autoPlay: !settings.autoPlay })}
            className={`w-12 h-7 rounded-full transition-colors relative ${settings.autoPlay ? 'bg-accent' : 'bg-overlay/10'}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-foreground transition-all ${settings.autoPlay ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-border">
          <div>
            <p className="text-[15px] text-foreground font-medium">Resume VOD from last position</p>
            <p className="text-sm text-muted mt-1">Continue watching movies where you left off</p>
          </div>
          <button
            onClick={() => updateSettings({ resumeVod: !settings.resumeVod })}
            className={`w-12 h-7 rounded-full transition-colors relative ${settings.resumeVod ? 'bg-accent' : 'bg-overlay/10'}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-foreground transition-all ${settings.resumeVod ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="py-4">
          <p className="text-[15px] text-foreground font-medium mb-2">External player</p>
          <p className="text-sm text-muted mb-3">Path to mpv, VLC, or another video player</p>
          <div className="flex gap-3">
            <input
              value={settings.externalPlayerPath || ''}
              onChange={e => updateSettings({ externalPlayerPath: e.target.value || null })}
              placeholder="Not configured"
              className="flex-1 bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
            />
            <button
              onClick={browsePlayer}
              className="px-4 py-2.5 rounded-lg bg-overlay/[0.05] border border-border text-sm text-secondary hover:text-foreground hover:bg-overlay/[0.08] transition-colors"
            >
              Browse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
