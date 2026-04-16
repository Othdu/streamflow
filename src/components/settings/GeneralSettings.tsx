import { useAppStore } from '@/store'
import { useI18n } from '@/hooks/useI18n'
import type { Language } from '@/types'

export default function GeneralSettings() {
  const settings = useAppStore(s => s.settings)
  const updateSettings = useAppStore(s => s.updateSettings)
  const clearWatchHistory = useAppStore(s => s.clearWatchHistory)
  const { t } = useI18n()

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">{t('general.title')}</h2>
      <p className="text-sm text-muted mb-8">{t('general.subtitle')}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div>
            <p className="text-[15px] text-foreground font-medium">{t('general.language')}</p>
            <p className="text-sm text-muted mt-1">{t('general.languageDesc')}</p>
          </div>
          <select
            value={settings.language}
            onChange={e => updateSettings({ language: e.target.value as Language })}
            className="bg-overlay/[0.06] border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent cursor-pointer hover:bg-overlay/[0.08] transition-colors"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-border">
          <div>
            <p className="text-[15px] text-foreground font-medium">{t('general.minimizeToTray')}</p>
            <p className="text-sm text-muted mt-1">{t('general.minimizeToTrayDesc')}</p>
          </div>
          <button
            onClick={() => updateSettings({ minimizeToTray: !settings.minimizeToTray })}
            className={`w-12 h-7 rounded-full transition-colors relative ${settings.minimizeToTray ? 'bg-accent' : 'bg-overlay/10'}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-foreground transition-all ${settings.minimizeToTray ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-border">
          <div>
            <p className="text-[15px] text-foreground font-medium">{t('general.startMinimized')}</p>
            <p className="text-sm text-muted mt-1">{t('general.startMinimizedDesc')}</p>
          </div>
          <button
            onClick={() => updateSettings({ startMinimized: !settings.startMinimized })}
            className={`w-12 h-7 rounded-full transition-colors relative ${settings.startMinimized ? 'bg-accent' : 'bg-overlay/10'}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-foreground transition-all ${settings.startMinimized ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="pt-6">
          <p className="text-xs font-semibold text-muted/70 uppercase tracking-wider mb-4">{t('general.data')}</p>
          <div className="flex gap-3">
            <button
              onClick={clearWatchHistory}
              className="px-5 py-2.5 rounded-lg bg-overlay/[0.05] border border-border text-sm text-secondary hover:text-foreground hover:bg-overlay/[0.08] transition-colors"
            >
              {t('general.clearHistory')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
