import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { PRESET_THEMES, getThemeById, applyTheme, applyCustomCSS, CSS_TEMPLATE } from '@/services/themes'

const ACCENT_PRESETS = [
  '#FF6B35', '#3B82F6', '#E50914', '#22C55E',
  '#A855F7', '#EC4899', '#06B6D4', '#F59E0B',
]

export default function AppearanceSettings() {
  const settings = useAppStore(s => s.settings)
  const updateSettings = useAppStore(s => s.updateSettings)

  const [showCssEditor, setShowCssEditor] = useState(false)
  const [cssText, setCssText] = useState(settings.customCSS || CSS_TEMPLATE)
  const [accentInput, setAccentInput] = useState(settings.accentOverride || '')

  const handleThemeChange = useCallback((themeId: string) => {
    const theme = getThemeById(themeId)
    applyTheme(theme, settings.accentOverride)
    updateSettings({ activeThemeId: themeId })
  }, [settings.accentOverride, updateSettings])

  const handleAccentChange = useCallback((color: string | null) => {
    const theme = getThemeById(settings.activeThemeId)
    applyTheme(theme, color)
    updateSettings({ accentOverride: color })
    setAccentInput(color || '')
  }, [settings.activeThemeId, updateSettings])

  const handleCssSave = useCallback(() => {
    applyCustomCSS(cssText)
    updateSettings({ customCSS: cssText })
  }, [cssText, updateSettings])

  const handleCssReset = useCallback(() => {
    setCssText(CSS_TEMPLATE)
    applyCustomCSS('')
    updateSettings({ customCSS: '' })
  }, [updateSettings])

  useEffect(() => {
    const theme = getThemeById(settings.activeThemeId)
    applyTheme(theme, settings.accentOverride)
    if (settings.customCSS) applyCustomCSS(settings.customCSS)
  }, [settings.activeThemeId, settings.accentOverride])

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">Appearance</h2>
      <p className="text-sm text-muted mb-8">Customize the look and feel of StreamFlow.</p>

      {/* Preset Themes */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-muted/70 uppercase tracking-wider mb-4">Theme</p>
        <div className="grid grid-cols-2 gap-3">
          {PRESET_THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                settings.activeThemeId === theme.id
                  ? 'border-accent ring-1 ring-accent/30'
                  : 'border-border hover:border-overlay/20'
              }`}
            >
              <div className="h-10 rounded-lg mb-3 overflow-hidden" style={{ background: theme.preview }} />
              <p className="text-sm text-foreground font-medium">{theme.name}</p>
              <p className="text-xs text-muted mt-1">{theme.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-muted/70 uppercase tracking-wider mb-4">Accent Color</p>
        <div className="flex items-center gap-3 mb-3">
          {ACCENT_PRESETS.map(color => (
            <button
              key={color}
              onClick={() => handleAccentChange(color)}
              className={`w-8 h-8 rounded-full transition-all ${
                settings.accentOverride === color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-base scale-110' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={() => handleAccentChange(null)}
            className={`px-3 h-8 rounded-full text-xs transition-all ${
              !settings.accentOverride ? 'bg-overlay/20 text-foreground font-medium' : 'bg-overlay/[0.05] text-muted hover:text-foreground'
            }`}
          >
            Default
          </button>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <input
            type="color"
            value={accentInput || '#FF6B35'}
            onChange={e => { setAccentInput(e.target.value); handleAccentChange(e.target.value) }}
            className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent"
          />
          <input
            placeholder="#FF6B35"
            value={accentInput}
            onChange={e => {
              setAccentInput(e.target.value)
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) handleAccentChange(e.target.value)
            }}
            className="w-32 bg-overlay/[0.04] border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
          />
        </div>
      </div>

      {/* Custom CSS */}
      <div>
        <button
          onClick={() => setShowCssEditor(!showCssEditor)}
          className="flex items-center gap-2.5 text-sm text-secondary hover:text-foreground transition-colors mb-4"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={showCssEditor ? '6 9 12 15 18 9' : '9 18 15 12 9 6'}/></svg>
          Advanced: Custom CSS
        </button>

        {showCssEditor && (
          <div className="animate-fade-in">
            <p className="text-sm text-muted mb-3">
              Write custom CSS to override any style. Changes apply live as you type.
            </p>
            <textarea
              value={cssText}
              onChange={e => { setCssText(e.target.value); applyCustomCSS(e.target.value) }}
              spellCheck={false}
              className="w-full h-72 bg-base/30 border border-border rounded-xl p-5 text-sm text-green-300 font-mono focus:outline-none focus:border-accent/30 resize-y leading-relaxed"
              placeholder="/* Your custom CSS here */"
            />
            <div className="flex gap-3 mt-3">
              <button onClick={handleCssSave} className="btn-primary px-5 py-2 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent-hover transition-colors">
                Save
              </button>
              <button onClick={handleCssReset} className="px-5 py-2 rounded-lg bg-overlay/[0.05] text-secondary text-sm hover:text-foreground transition-colors">
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
