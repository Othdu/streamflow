import type { Theme } from '@/types'

export const PRESET_THEMES: Theme[] = [
  {
    id: 'streamflow-dark',
    name: 'StreamFlow Dark',
    description: 'Default dark theme with indigo accent',
    preview: 'linear-gradient(135deg, #0a0d14, #0e1219, #6366f1)',
    colors: {
      base: '#0a0d14', surface: '#0e1219', card: '#141820',
      accent: '#6366f1', accentHover: '#818cf8',
      text: '#e6edf3', textSecondary: '#8b949e', textMuted: '#3d4450',
      border: 'rgba(255,255,255,0.04)', subtle: 'rgba(255,255,255,0.02)',
      danger: '#f85149', success: '#3fb950',
    },
  },
  {
    id: 'oled-black',
    name: 'OLED Black',
    description: 'Pure black for OLED screens',
    preview: 'linear-gradient(135deg, #000000, #0A0A0A, #3B82F6)',
    colors: {
      base: '#000000', surface: '#0A0A0A', card: '#111111',
      accent: '#3B82F6', accentHover: '#60A5FA',
      text: '#FFFFFF', textSecondary: '#A0A0A0', textMuted: '#606060',
      border: 'rgba(255,255,255,0.08)', subtle: 'rgba(255,255,255,0.04)',
      danger: '#EF4444', success: '#22C55E',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Deep navy with electric blue accent',
    preview: 'linear-gradient(135deg, #0A1628, #132040, #2563EB)',
    colors: {
      base: '#0A1628', surface: '#0F1D35', card: '#152545',
      accent: '#2563EB', accentHover: '#3B82F6',
      text: '#E0E7F0', textSecondary: '#7B8DA8', textMuted: '#4A5E78',
      border: 'rgba(255,255,255,0.06)', subtle: 'rgba(255,255,255,0.03)',
      danger: '#EF4444', success: '#22C55E',
    },
  },
  {
    id: 'crimson-night',
    name: 'Crimson Night',
    description: 'Dark gray with Netflix-inspired red accent',
    preview: 'linear-gradient(135deg, #141414, #1C1C1C, #E50914)',
    colors: {
      base: '#141414', surface: '#1C1C1C', card: '#242424',
      accent: '#E50914', accentHover: '#FF1A25',
      text: '#E5E5E5', textSecondary: '#999999', textMuted: '#666666',
      border: 'rgba(255,255,255,0.08)', subtle: 'rgba(255,255,255,0.04)',
      danger: '#EF4444', success: '#22C55E',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Dark green-tinted with Spotify-like feel',
    preview: 'linear-gradient(135deg, #0D1512, #121E1A, #1DB954)',
    colors: {
      base: '#0D1512', surface: '#121E1A', card: '#182822',
      accent: '#1DB954', accentHover: '#1ED760',
      text: '#E0EDE6', textSecondary: '#7B9E8C', textMuted: '#4A6858',
      border: 'rgba(255,255,255,0.06)', subtle: 'rgba(255,255,255,0.03)',
      danger: '#EF4444', success: '#1DB954',
    },
  },
  {
    id: 'arctic-light',
    name: 'Arctic Light',
    description: 'Clean light theme with blue accent',
    preview: 'linear-gradient(135deg, #F8FAFC, #E2E8F0, #3B82F6)',
    colors: {
      base: '#F8FAFC', surface: '#FFFFFF', card: '#F1F5F9',
      accent: '#3B82F6', accentHover: '#2563EB',
      text: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8',
      border: 'rgba(0,0,0,0.08)', subtle: 'rgba(0,0,0,0.03)',
      danger: '#EF4444', success: '#22C55E',
    },
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    description: 'Warm browns with amber accent',
    preview: 'linear-gradient(135deg, #1A1410, #241C14, #F59E0B)',
    colors: {
      base: '#1A1410', surface: '#211A12', card: '#2A2018',
      accent: '#F59E0B', accentHover: '#FBBF24',
      text: '#F0E6D8', textSecondary: '#A8977E', textMuted: '#6E6050',
      border: 'rgba(255,255,255,0.07)', subtle: 'rgba(255,255,255,0.03)',
      danger: '#EF4444', success: '#22C55E',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon pink/purple on dark background',
    preview: 'linear-gradient(135deg, #0A0A12, #12101E, #E040FB)',
    colors: {
      base: '#0A0A12', surface: '#110F1E', card: '#181528',
      accent: '#E040FB', accentHover: '#EA80FC',
      text: '#F0E6FF', textSecondary: '#9E88C0', textMuted: '#5E4E78',
      border: 'rgba(224,64,251,0.12)', subtle: 'rgba(255,255,255,0.03)',
      danger: '#FF1744', success: '#00E676',
    },
    effects: { cardRadius: '8px', blur: true, animations: true },
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    description: 'Neutral monochrome, no colored accent',
    preview: 'linear-gradient(135deg, #18181B, #27272A, #A1A1AA)',
    colors: {
      base: '#18181B', surface: '#1E1E22', card: '#27272A',
      accent: '#A1A1AA', accentHover: '#D4D4D8',
      text: '#E4E4E7', textSecondary: '#A1A1AA', textMuted: '#52525B',
      border: 'rgba(255,255,255,0.08)', subtle: 'rgba(255,255,255,0.04)',
      danger: '#EF4444', success: '#22C55E',
    },
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Deep',
    description: 'Dark teal with cyan accent',
    preview: 'linear-gradient(135deg, #0A1418, #0F2028, #06B6D4)',
    colors: {
      base: '#0A1418', surface: '#0F1E24', card: '#152830',
      accent: '#06B6D4', accentHover: '#22D3EE',
      text: '#E0F0F4', textSecondary: '#6BA8B8', textMuted: '#3A6878',
      border: 'rgba(255,255,255,0.06)', subtle: 'rgba(255,255,255,0.03)',
      danger: '#EF4444', success: '#22C55E',
    },
  },
]

function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function parseBorderAlpha(borderStr: string): number {
  const m = borderStr.match(/[\d.]+\)$/)
  return m ? parseFloat(m[0]) : 0.06
}

export function getThemeById(id: string): Theme {
  return PRESET_THEMES.find(t => t.id === id) ?? PRESET_THEMES[0]
}

function getOrCreateStyle(id: string): HTMLStyleElement {
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  return el
}

export function applyTheme(theme: Theme, accentOverride?: string | null) {
  const root = document.documentElement
  const c = theme.colors
  const accent = accentOverride || c.accent
  const light = isLightColor(c.base)
  const borderAlpha = parseBorderAlpha(c.border)
  const subtleAlpha = parseBorderAlpha(c.subtle)
  const radius = theme.effects?.cardRadius ?? '12px'

  // Write theme vars directly so updates are immediate and deterministic.
  root.style.setProperty('--sf-base', hexToRgbChannels(c.base))
  root.style.setProperty('--sf-surface', hexToRgbChannels(c.surface))
  root.style.setProperty('--sf-card', hexToRgbChannels(c.card))
  root.style.setProperty('--sf-accent', hexToRgbChannels(accent))
  root.style.setProperty('--sf-accent-hover', hexToRgbChannels(accentOverride ? adjustBrightness(accentOverride, 20) : c.accentHover))
  root.style.setProperty('--sf-text', hexToRgbChannels(c.text))
  root.style.setProperty('--sf-text-secondary', hexToRgbChannels(c.textSecondary))
  root.style.setProperty('--sf-text-muted', hexToRgbChannels(c.textMuted))
  root.style.setProperty('--sf-danger', hexToRgbChannels(c.danger))
  root.style.setProperty('--sf-success', hexToRgbChannels(c.success))
  root.style.setProperty('--sf-overlay', light ? '0 0 0' : '255 255 255')
  root.style.setProperty('--sf-border-alpha', String(borderAlpha))
  root.style.setProperty('--sf-border-light-alpha', String(Math.min(1, borderAlpha + 0.04)))
  root.style.setProperty('--sf-subtle-alpha', String(subtleAlpha))
  root.style.setProperty('--sf-card-radius', radius)
}

const COLOR_CHANNEL_VARS = [
  'base',
  'surface',
  'card',
  'accent',
  'accent-hover',
  'text',
  'text-secondary',
  'text-muted',
  'danger',
  'success',
  'overlay',
]

function normalizeLegacyCustomCSS(css: string): string {
  let out = css

  // Convert old hex variables to RGB channels (e.g. --sf-base: #0a0d14 -> --sf-base: 10 13 20)
  for (const name of COLOR_CHANNEL_VARS) {
    const hexPattern = new RegExp(`(--sf-${name}\\s*:\\s*)#([0-9a-fA-F]{6})(\\s*;)`, 'g')
    out = out.replace(hexPattern, (_m, prefix: string, hex: string, suffix: string) => {
      return `${prefix}${hexToRgbChannels(`#${hex}`)}${suffix}`
    })
  }

  // Convert legacy rgba variables to alpha-only variables used by the new theme model.
  out = out.replace(/--sf-border\s*:\s*rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)\s*;/g, '--sf-border-alpha: $1;')
  out = out.replace(/--sf-border-light\s*:\s*rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)\s*;/g, '--sf-border-light-alpha: $1;')
  out = out.replace(/--sf-subtle\s*:\s*rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)\s*;/g, '--sf-subtle-alpha: $1;')

  return out
}

function forceVarOverridesImportant(css: string): string {
  return css.replace(/(--sf-[\w-]+\s*:\s*[^;!]+)(\s*;)/g, '$1 !important$2')
}

export function applyCustomCSS(css: string) {
  const el = getOrCreateStyle('sf-custom-css')
  const normalized = normalizeLegacyCustomCSS(css)
  el.textContent = forceVarOverridesImportant(normalized)
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, ((num >> 16) & 0xFF) + amount)
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount)
  const b = Math.min(255, (num & 0xFF) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export const CSS_TEMPLATE = `/* StreamFlow Custom CSS
   Override theme variables or add any CSS rules.
   Colors use RGB channels: R G B (e.g. 255 100 50)
   Legacy hex colors are also accepted and auto-converted.

   Uncomment a line below to try it: */

:root {
  /* --sf-base: 10 13 20; */
  /* --sf-surface: 14 18 25; */
  /* --sf-card: 20 24 32; */
  /* --sf-accent: 99 102 241; */
  /* --sf-accent-hover: 129 140 248; */
  /* --sf-text: 230 237 243; */
  /* --sf-text-secondary: 139 148 158; */
  /* --sf-text-muted: 61 68 80; */
  /* --sf-overlay: 255 255 255; */
  /* --sf-card-radius: 10px; */
}

/* Example: make accent color red */
/* :root { --sf-accent: 239 68 68; } */

/* Example: custom scrollbar */
/* ::-webkit-scrollbar-thumb { background: rgb(var(--sf-accent) / 0.3); } */
`
