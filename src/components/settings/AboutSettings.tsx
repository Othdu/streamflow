import { useState, useEffect } from 'react'

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready'

export default function AboutSettings() {
  const [appVersion, setAppVersion] = useState('...')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateVersion, setUpdateVersion] = useState('')

  useEffect(() => {
    const electron = (window as any).electron
    electron?.getVersion?.().then((v: string) => setAppVersion(v || '1.0.0')).catch(() => {})

    electron?.updater?.onAvailable?.((version: string) => {
      setUpdateVersion(version)
      setUpdateStatus('available')
    })
    electron?.updater?.onDownloaded?.(() => {
      setUpdateStatus('ready')
    })
  }, [])

  const handleCheck = async () => {
    const electron = (window as any).electron
    if (!electron?.updater?.check) return
    setUpdateStatus('checking')
    try {
      const result = await electron.updater.check()
      if (result?.available) {
        setUpdateVersion(result.version || '')
        setUpdateStatus('available')
      } else {
        setUpdateStatus('idle')
      }
    } catch {
      setUpdateStatus('idle')
    }
  }

  const handleDownload = async () => {
    const electron = (window as any).electron
    if (!electron?.updater?.download) return
    setUpdateStatus('downloading')
    try {
      await electron.updater.download()
    } catch {
      setUpdateStatus('available')
    }
  }

  const handleInstall = () => {
    const electron = (window as any).electron
    electron?.updater?.install?.()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">About</h2>
      <p className="text-sm text-muted mb-8">StreamFlow IPTV Player</p>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-5 mb-5">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-accent"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
          <div>
            <p className="text-xl text-foreground font-bold">StreamFlow</p>
            <p className="text-sm text-muted mt-0.5">Version {appVersion}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-sm text-muted">Electron</span>
            <span className="text-sm text-secondary">{(window as any).process?.versions?.electron ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-sm text-muted">Chrome</span>
            <span className="text-sm text-secondary">{(window as any).process?.versions?.chrome ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-sm text-muted">Node</span>
            <span className="text-sm text-secondary">{(window as any).process?.versions?.node ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-sm text-muted">Platform</span>
            <span className="text-sm text-secondary">{navigator.platform}</span>
          </div>
        </div>
      </div>

      {/* Update section */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="text-[13px] font-semibold text-foreground mb-3">Updates</p>

        {updateStatus === 'idle' && (
          <button
            onClick={handleCheck}
            className="px-5 py-2.5 rounded-lg bg-overlay/[0.06] hover:bg-overlay/[0.1] text-sm text-secondary hover:text-foreground font-medium transition-colors"
          >
            Check for Updates
          </button>
        )}

        {updateStatus === 'checking' && (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-sm text-muted">Checking for updates...</span>
          </div>
        )}

        {updateStatus === 'available' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-sm text-foreground">Update available{updateVersion ? `: v${updateVersion}` : ''}</span>
            </div>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-foreground text-sm font-medium transition-colors"
            >
              Download Update
            </button>
          </div>
        )}

        {updateStatus === 'downloading' && (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-sm text-muted">Downloading update...</span>
          </div>
        )}

        {updateStatus === 'ready' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-foreground">Update downloaded and ready to install</span>
            </div>
            <button
              onClick={handleInstall}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-foreground text-sm font-medium transition-colors"
            >
              Restart to Update
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted/50">Built with Electron, React, and Tailwind CSS</p>
      </div>
    </div>
  )
}
