import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TitleBar from '@/components/TitleBar'
import GeneralSettings from '@/components/settings/GeneralSettings'
import PlaylistSettings from '@/components/settings/PlaylistSettings'
import AppearanceSettings from '@/components/settings/AppearanceSettings'
import PlayerSettings from '@/components/settings/PlayerSettings'
import ShortcutSettings from '@/components/settings/ShortcutSettings'
import AboutSettings from '@/components/settings/AboutSettings'
import { useI18n } from '@/hooks/useI18n'

const SECTION_ICONS: Record<string, JSX.Element> = {
  general: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg>,
  playlists: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3M16 6H3M12 18H3"/></svg>,
  appearance: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5"/><path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Z"/></svg>,
  player: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  shortcuts: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8M6 16h.01M18 16h.01M10 16h4"/></svg>,
  about: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
}

const SECTION_IDS = ['general', 'playlists', 'appearance', 'player', 'shortcuts', 'about'] as const

export default function SettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('general')
  const { t, isRTL } = useI18n()

  const sectionLabels: Record<string, string> = {
    general: t('settings.general'),
    playlists: t('settings.playlists'),
    appearance: t('settings.appearance'),
    player: t('settings.player'),
    shortcuts: t('settings.shortcuts'),
    about: t('settings.about'),
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-base" dir={isRTL() ? 'rtl' : 'ltr'}>
      <TitleBar />
      <div className="flex flex-1 pt-10 overflow-hidden">
        <aside className={`w-[240px] h-full bg-surface ${isRTL() ? 'border-l' : 'border-r'} border-overlay/[0.04] flex flex-col shrink-0 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/[0.03] to-transparent" />
          <div className="relative z-10">
            <div className="px-5 pt-5 pb-4">
              <button onClick={() => navigate('/app')} className="flex items-center gap-2.5 text-foreground/30 hover:text-foreground text-[12px] transition-colors group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${isRTL() ? 'rotate-180 group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5'}`}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                {t('settings.back')}
              </button>
              <h1 className="text-xl font-bold text-foreground mt-4">{t('settings.title')}</h1>
            </div>
            <div className="px-3 flex-1">
              {SECTION_IDS.map(id => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[12px] transition-all mb-0.5 ${
                    activeSection === id
                      ? 'bg-accent/10 text-accent-hover font-semibold ring-1 ring-accent/15'
                      : 'text-foreground/35 hover:text-foreground/60 hover:bg-overlay/[0.03]'
                  }`}
                >
                  <span className={activeSection === id ? 'text-accent' : 'opacity-40'}>{SECTION_ICONS[id]}</span>
                  {sectionLabels[id]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-10 py-8">
            {activeSection === 'general' && <GeneralSettings />}
            {activeSection === 'playlists' && <PlaylistSettings />}
            {activeSection === 'appearance' && <AppearanceSettings />}
            {activeSection === 'player' && <PlayerSettings />}
            {activeSection === 'shortcuts' && <ShortcutSettings />}
            {activeSection === 'about' && <AboutSettings />}
          </div>
        </main>
      </div>
    </div>
  )
}
