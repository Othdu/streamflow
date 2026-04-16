import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { getThemeById, applyTheme, applyCustomCSS } from '@/services/themes'
import { setLanguage } from '@/services/i18n'
import LoginPage from '@/pages/LoginPage'
import AppPage from '@/pages/AppPage'
import SettingsPage from '@/pages/SettingsPage'

function applyCurrentTheme() {
  const settings = useAppStore.getState().settings
  const theme = getThemeById(settings.activeThemeId)
  applyTheme(theme, settings.accentOverride)
  if (settings.customCSS) applyCustomCSS(settings.customCSS)
}

// Apply theme immediately on module load (before React renders)
applyCurrentTheme()

export default function App() {
  const loadPlaylists = useAppStore(s => s.loadPlaylists)
  const loadSettings = useAppStore(s => s.loadSettings)
  const hasPlaylists = useAppStore(s => s.playlists.length > 0)
  const playlistsLoaded = useAppStore(s => s.playlistsLoaded)
  const activeThemeId = useAppStore(s => s.settings.activeThemeId)
  const accentOverride = useAppStore(s => s.settings.accentOverride)
  const language = useAppStore(s => s.settings.language)

  useEffect(() => {
    loadPlaylists()
    loadSettings().then(() => applyCurrentTheme())
  }, [])

  // Re-apply theme whenever theme settings change
  useEffect(() => {
    applyCurrentTheme()
  }, [activeThemeId, accentOverride])

  // Apply language direction
  useEffect(() => {
    setLanguage(language)
  }, [language])

  if (!playlistsLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/app"      element={<AppPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*"         element={<Navigate to={hasPlaylists ? '/app' : '/login'} replace />} />
      </Routes>
    </HashRouter>
  )
}
