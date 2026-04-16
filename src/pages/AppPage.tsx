import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { useDirection } from '@/hooks/useI18n'
import TitleBar from '@/components/TitleBar'
import Sidebar from '@/components/Sidebar'
import ChannelGrid from '@/components/ChannelGrid'
import VideoPlayer from '@/components/VideoPlayer'
import EpgGuide from '@/components/EpgGuide'

export default function AppPage() {
  const navigate = useNavigate()
  const hasPlaylists = useAppStore(s => s.playlists.length > 0)
  const isPlaying = useAppStore(s => s.player.isPlaying)
  const loadFavorites = useAppStore(s => s.loadFavorites)

  const loadWatchHistory = useAppStore(s => s.loadWatchHistory)
  const loadSettings = useAppStore(s => s.loadSettings)

  const [showEpg, setShowEpg] = useState(false)
  const dir = useDirection()

  useEffect(() => {
    loadFavorites()
    loadWatchHistory()
    loadSettings()
  }, [])
  useEffect(() => { if (!hasPlaylists) navigate('/login') }, [hasPlaylists])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }
      if (e.key === 'g' && !isPlaying && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        setShowEpg(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, navigate])

  return (
    <div className="h-screen flex flex-col overflow-hidden relative bg-base" dir={dir}>
      <TitleBar />
      <div className="flex flex-1 pt-10 overflow-hidden">
        {!isPlaying && <Sidebar onOpenEpg={() => setShowEpg(true)} />}
        <main className="flex-1 flex overflow-hidden">
          {isPlaying ? (
            <div className="flex-1 animate-fade-in">
              <VideoPlayer />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ChannelGrid />
            </div>
          )}
        </main>
      </div>
      {showEpg && <EpgGuide onClose={() => setShowEpg(false)} />}
    </div>
  )
}
