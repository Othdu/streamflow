import { useState } from 'react'
import { useAppStore } from '@/store'
import { getXtreamService } from '@/services/xtream'
import type { Playlist, XtreamAuthResponse } from '@/types'

export default function PlaylistSettings() {
  const playlists = useAppStore(s => s.playlists)
  const activePlaylistId = useAppStore(s => s.activePlaylistId)
  const setActivePlaylist = useAppStore(s => s.setActivePlaylist)
  const addPlaylist = useAppStore(s => s.addPlaylist)
  const updatePlaylist = useAppStore(s => s.updatePlaylist)
  const removePlaylist = useAppStore(s => s.removePlaylist)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ server: '', username: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authInfo, setAuthInfo] = useState<Record<string, XtreamAuthResponse | null>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ server: '', username: '', password: '', name: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const testConnection = async (playlist: Playlist) => {
    try {
      const svc = getXtreamService(playlist)
      const resp = await svc.authenticate()
      setAuthInfo(prev => ({ ...prev, [playlist.id]: resp }))
    } catch {
      setAuthInfo(prev => ({ ...prev, [playlist.id]: null }))
    }
  }

  const handleAdd = async () => {
    setLoading(true)
    setError('')
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
      setShowAdd(false)
      setForm({ server: '', username: '', password: '', name: '' })
    } catch (e: any) {
      setError(e.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (pl: Playlist) => {
    setEditingId(pl.id)
    setEditForm({ server: pl.server, username: pl.username, password: pl.password, name: pl.name })
    setEditError('')
  }

  const handleEdit = async (id: string) => {
    setEditLoading(true)
    setEditError('')
    try {
      const testPlaylist: Playlist = {
        id,
        name: editForm.name || editForm.server,
        server: editForm.server.trim(),
        username: editForm.username.trim(),
        password: editForm.password,
        addedAt: Date.now(),
      }
      const svc = getXtreamService(testPlaylist)
      await svc.authenticate()
      await updatePlaylist(id, {
        name: editForm.name || editForm.server,
        server: editForm.server.trim(),
        username: editForm.username.trim(),
        password: editForm.password,
      })
      setEditingId(null)
    } catch (e: any) {
      setEditError(e.message || 'Connection failed')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await removePlaylist(id)
    setConfirmDelete(null)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">Playlists</h2>
      <p className="text-sm text-muted mb-8">Manage your IPTV provider connections.</p>

      <button
        onClick={() => setShowAdd(!showAdd)}
        className="mb-5 flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-foreground text-sm font-medium transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Add Playlist
      </button>

      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-5 mb-5 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Server URL"
              value={form.server}
              onChange={e => setForm(f => ({ ...f, server: e.target.value }))}
              className="col-span-2 bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
            />
            <input
              placeholder="Username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
            />
            <input
              placeholder="Name (optional)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="col-span-2 bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleAdd} disabled={loading || !form.server || !form.username || !form.password}
              className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-foreground text-sm font-medium transition-colors disabled:opacity-40">
              {loading ? 'Connecting...' : 'Add & Connect'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-lg bg-overlay/[0.05] text-secondary text-sm hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {playlists.map(pl => {
          const isActive = pl.id === activePlaylistId
          const info = authInfo[pl.id]
          return (
            <div key={pl.id} className={`rounded-xl border p-5 transition-colors ${isActive ? 'border-accent/30 bg-accent/[0.04]' : 'border-border bg-card'}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="text-[15px] text-foreground font-medium truncate">{pl.name}</p>
                    {isActive && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent">ACTIVE</span>}
                  </div>
                  <p className="text-sm text-muted mt-1 truncate">{pl.server}</p>
                  <p className="text-xs text-muted/60 mt-0.5">{pl.username}</p>
                  {info && (
                    <div className="flex gap-4 mt-3 text-xs text-secondary">
                      <span>Expires: {new Date(Number(info.user_info.exp_date) * 1000).toLocaleDateString()}</span>
                      <span>Max: {info.user_info.max_connections} connections</span>
                      <span>Active: {info.user_info.active_cons}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!isActive && (
                    <button onClick={() => setActivePlaylist(pl.id)} className="px-3.5 py-2 rounded-lg bg-overlay/[0.05] text-sm text-secondary hover:text-foreground hover:bg-overlay/[0.08] transition-colors">
                      Activate
                    </button>
                  )}
                  <button onClick={() => startEditing(pl)} className="px-3.5 py-2 rounded-lg bg-overlay/[0.05] text-sm text-secondary hover:text-foreground hover:bg-overlay/[0.08] transition-colors">
                    Edit
                  </button>
                  <button onClick={() => testConnection(pl)} className="px-3.5 py-2 rounded-lg bg-overlay/[0.05] text-sm text-secondary hover:text-foreground hover:bg-overlay/[0.08] transition-colors">
                    Test
                  </button>
                  <button onClick={() => setConfirmDelete(pl.id)} className="px-3.5 py-2 rounded-lg bg-red-500/10 text-sm text-red-400 hover:bg-red-500/20 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
              {editingId === pl.id && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Server URL"
                      value={editForm.server}
                      onChange={e => setEditForm(f => ({ ...f, server: e.target.value }))}
                      className="col-span-2 bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
                    />
                    <input
                      placeholder="Username"
                      value={editForm.username}
                      onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                      className="bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
                    />
                    <input
                      placeholder="Password"
                      type="password"
                      value={editForm.password}
                      onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                      className="bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
                    />
                    <input
                      placeholder="Name (optional)"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="col-span-2 bg-overlay/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/30"
                    />
                  </div>
                  {editError && <p className="text-red-400 text-sm mt-3">{editError}</p>}
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => handleEdit(pl.id)} disabled={editLoading || !editForm.server || !editForm.username || !editForm.password}
                      className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-foreground text-sm font-medium transition-colors disabled:opacity-40">
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-5 py-2 rounded-lg bg-overlay/[0.05] text-secondary text-sm hover:text-foreground transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {confirmDelete === pl.id && (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                  <p className="text-sm text-red-400 flex-1">Are you sure? This cannot be undone.</p>
                  <button onClick={() => handleDelete(pl.id)} className="px-4 py-1.5 rounded-lg bg-red-500 text-foreground text-sm font-medium hover:bg-red-600 transition-colors">
                    Delete
                  </button>
                  <button onClick={() => setConfirmDelete(null)} className="px-4 py-1.5 rounded-lg bg-overlay/[0.05] text-sm text-secondary hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {playlists.length === 0 && (
          <div className="text-center py-16 text-muted">
            <p className="text-base">No playlists configured</p>
            <p className="text-sm mt-1.5 text-muted/60">Add a playlist above to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
