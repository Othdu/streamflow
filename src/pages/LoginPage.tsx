import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { getXtreamService } from '@/services/xtream'
import { useI18n } from '@/hooks/useI18n'
import TitleBar from '@/components/TitleBar'
import type { Playlist } from '@/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const addPlaylist = useAppStore(s => s.addPlaylist)
  const hasPlaylists = useAppStore(s => s.playlists.length > 0)
  const { t, isRTL } = useI18n()

  const [form, setForm] = useState({ name: '', server: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name: form.name || form.server,
      server: form.server.trim(),
      username: form.username.trim(),
      password: form.password,
      addedAt: Date.now(),
    }

    try {
      const svc = getXtreamService(playlist)
      await svc.authenticate()
      await addPlaylist(playlist)
      navigate('/app')
    } catch {
      setError(t('login.connectionFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-base border border-overlay/[0.08] rounded-lg px-4 py-3 text-[13px] text-foreground placeholder-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all'

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-base" dir={isRTL() ? 'rtl' : 'ltr'}>
      <TitleBar />
      <div className="flex flex-1 pt-10 overflow-hidden">

      {/* Left: Branding panel */}
      <div className="hidden md:flex w-[45%] relative flex-col items-center justify-center overflow-hidden bg-surface">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] via-transparent to-blue-500/[0.03]" />
        <div className="absolute top-20 -left-20 w-80 h-80 bg-accent/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-20 -right-20 w-60 h-60 bg-accent/[0.03] rounded-full blur-[80px]" />

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accent/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">StreamFlow</h1>
          <p className="text-secondary text-[15px] leading-relaxed max-w-[280px] mx-auto">
            {t('login.tagline')}
          </p>

          <div className="mt-10 flex items-center gap-6 text-[12px] text-muted justify-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-overlay/[0.04] flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20"/><circle cx="4" cy="18" r="2"/></svg>
              </div>
              {t('tab.live')}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-overlay/[0.04] flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>
              </div>
              {t('tab.movies')}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-overlay/[0.04] flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
              </div>
              {t('tab.series')}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            </div>
            <h1 className="text-xl font-bold text-foreground">StreamFlow</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-[22px] font-semibold text-foreground">{t('login.addPlaylist')}</h2>
            <p className="text-secondary text-[13px] mt-1">{t('login.enterCredentials')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-secondary mb-1.5 ms-1">
                {t('login.playlistName')}
              </label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="My IPTV" className={inputClass} />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-secondary mb-1.5 ms-1">{t('playlist.serverUrl')}</label>
              <input name="server" value={form.server} onChange={handleChange} placeholder="http://provider.com:8080" required className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-secondary mb-1.5 ms-1">{t('playlist.username')}</label>
                <input name="username" value={form.username} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-secondary mb-1.5 ms-1">{t('playlist.password')}</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required className={inputClass} />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-red-400 text-[12px] bg-red-500/[0.07] border border-red-500/[0.12] rounded-lg px-3.5 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-[1px]"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-foreground font-semibold rounded-lg py-3 text-[13px] transition-all mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
                  {t('playlist.connecting')}
                </span>
              ) : t('login.connect')}
            </button>
          </form>

          {hasPlaylists && (
            <button onClick={() => navigate('/app')} className="w-full mt-4 text-secondary text-[12px] hover:text-foreground transition-colors text-center py-1.5">
              {t('login.backToPlayer')}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
