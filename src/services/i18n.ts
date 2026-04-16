import type { Language } from '@/types'

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Tabs
    'tab.live': 'Live TV',
    'tab.movies': 'Movies',
    'tab.series': 'Series',

    // Sidebar
    'sidebar.xtream': 'Xtream Codes',
    'sidebar.noPlaylist': 'No playlist',
    'sidebar.addPlaylist': 'Add playlist',
    'sidebar.tvGuide': 'TV Guide',
    'sidebar.categories': 'Categories',
    'sidebar.favorites': 'Favorites',
    'sidebar.allChannels': 'All Channels',
    'sidebar.allMovies': 'All Movies',
    'sidebar.allSeries': 'All Series',
    'sidebar.collapse': 'Collapse',
    'sidebar.settings': 'Settings',

    // Channel Grid
    'grid.liveTelevision': 'Live Television',
    'grid.videoOnDemand': 'Video on Demand',
    'grid.tvSeries': 'TV Series',
    'grid.channels': 'channels',
    'grid.movies': 'movies',
    'grid.series': 'series',
    'grid.sortAZ': 'A-Z',
    'grid.sortRecent': 'Recent',
    'grid.sortMostWatched': 'Most Watched',
    'grid.searchChannels': 'Search channels...',
    'grid.searchMovies': 'Search movies...',
    'grid.searchSeries': 'Search series...',
    'grid.continueWatching': 'Continue Watching',
    'grid.clearAll': 'Clear All',
    'grid.noFound': 'No {label} found',
    'grid.tryDifferent': 'Try a different category or search',

    // Player
    'player.selectChannel': 'Select a channel to watch',
    'player.live': 'LIVE',
    'player.vod': 'Video on Demand',
    'player.playbackError': 'Playback Error',
    'player.openExternal': 'Open in External Player (mpv / VLC)',
    'player.installHEVC': 'Install HEVC Extension (Windows Store)',
    'player.retry': 'Retry',
    'player.goBack': 'Go Back',
    'player.configurePlayer': 'Configure mpv or VLC in Settings → Player for best compatibility',
    'player.loading': 'Loading...',
    'player.audio': 'Audio',
    'player.subtitles': 'Subtitles',
    'player.off': 'Off',
    'player.alwaysShowResumePrompt': 'Always show resume prompt',
    'player.alwaysShowResumePromptDesc':
      'Offer Resume and Start over when a saved position exists, even if Resume VOD is turned off.',

    // VOD Detail
    'vod.play': 'Play',
    'vod.resume': 'Resume',
    'vod.resumeFrom': 'Resume from {time}',
    'vod.startOver': 'Start Over',
    'vod.loadingDetails': 'Loading details...',
    'vod.plot': 'Plot',
    'vod.director': 'Director',
    'vod.genre': 'Genre',
    'vod.releaseDate': 'Release Date',
    'vod.duration': 'Duration',
    'vod.cast': 'Cast',
    'vod.movie': 'Movie',
    'vod.download': 'Download to device',
    'vod.downloading': 'Downloading…',
    'vod.downloadingPct': 'Downloading… {pct}%',
    'vod.downloadDone': 'File saved successfully.',
    'vod.downloadError': 'Download failed. Try again or check your connection.',
    'vod.downloadCancel': 'Cancel download',
    'vod.downloadCanceled': 'Download canceled.',
    'vod.stopDownload': 'Stop download',
    'vod.downloadGbPair': '{used} GB of {total} GB',
    'vod.downloadGbOnly': '{used} GB downloaded',
    'vod.downloadEtaPending': 'Estimating time remaining…',
    'vod.downloadEtaLine': '~{eta} remaining',
    'vod.downloadEtaNoTotal': 'Full file size unknown — time remaining can\'t be estimated.',
    'vod.etaSeconds': '{n} sec',
    'vod.etaMinutes': '{n} min',
    'vod.etaHoursMinutes': '{h} h {m} min',
    'vod.downloadDisclaimer':
      'For personal use only. You are responsible for complying with your provider\'s terms and applicable laws.',

    // Series detail
    'series.resume': 'Resume',
    'series.startOver': 'From start',

    // EPG
    'epg.title': 'TV Guide',
    'epg.channels': 'channels',
    'epg.loading': 'Loading EPG data...',
    'epg.catchUp': 'CATCH-UP',
    'epg.clickCatchUp': 'Click to watch catch-up',

    // Settings
    'settings.title': 'Settings',
    'settings.back': 'Back',
    'settings.general': 'General',
    'settings.playlists': 'Playlists',
    'settings.appearance': 'Appearance',
    'settings.player': 'Player',
    'settings.shortcuts': 'Shortcuts',
    'settings.about': 'About',

    // General Settings
    'general.title': 'General',
    'general.subtitle': 'Configure startup behavior and app preferences.',
    'general.minimizeToTray': 'Minimize to tray',
    'general.minimizeToTrayDesc': 'Keep running in the background when window is closed',
    'general.startMinimized': 'Start minimized',
    'general.startMinimizedDesc': 'Launch the app minimized to the system tray',
    'general.language': 'Language',
    'general.languageDesc': 'Choose the app language',
    'general.data': 'Data',
    'general.clearHistory': 'Clear watch history',

    // Playlist Settings
    'playlist.title': 'Playlists',
    'playlist.subtitle': 'Manage your IPTV provider connections.',
    'playlist.add': 'Add Playlist',
    'playlist.serverUrl': 'Server URL',
    'playlist.username': 'Username',
    'playlist.password': 'Password',
    'playlist.nameOptional': 'Name (optional)',
    'playlist.addConnect': 'Add & Connect',
    'playlist.cancel': 'Cancel',
    'playlist.connecting': 'Connecting...',
    'playlist.activate': 'Activate',
    'playlist.edit': 'Edit',
    'playlist.test': 'Test',
    'playlist.delete': 'Delete',
    'playlist.confirmDelete': 'Are you sure? This cannot be undone.',
    'playlist.saveChanges': 'Save Changes',
    'playlist.saving': 'Saving...',
    'playlist.active': 'ACTIVE',
    'playlist.noPlaylists': 'No playlists configured',
    'playlist.addAbove': 'Add a playlist above to get started',
    'playlist.expires': 'Expires',
    'playlist.maxConnections': 'Max',
    'playlist.activeConnections': 'Active',

    // About
    'about.title': 'About',
    'about.subtitle': 'StreamFlow IPTV Player',
    'about.version': 'Version',
    'about.platform': 'Platform',
    'about.updates': 'Updates',
    'about.checkUpdates': 'Check for Updates',
    'about.checking': 'Checking for updates...',
    'about.updateAvailable': 'Update available',
    'about.downloadUpdate': 'Download Update',
    'about.downloading': 'Downloading update...',
    'about.updateReady': 'Update downloaded and ready to install',
    'about.restartUpdate': 'Restart to Update',
    'about.builtWith': 'Built with Electron, React, and Tailwind CSS',

    // Login
    'login.addPlaylist': 'Add playlist',
    'login.enterCredentials': 'Enter your Xtream Codes credentials',
    'login.playlistName': 'Playlist name',
    'login.connect': 'Connect',
    'login.connectionFailed': 'Connection failed. Check your server URL and credentials.',
    'login.backToPlayer': 'Back to player',
    'login.tagline': 'Your premium desktop player for live TV, movies, and series.',
  },

  ar: {
    // Tabs
    'tab.live': 'البث المباشر',
    'tab.movies': 'الأفلام',
    'tab.series': 'المسلسلات',

    // Sidebar
    'sidebar.xtream': 'إكستريم كودز',
    'sidebar.noPlaylist': 'لا توجد قائمة',
    'sidebar.addPlaylist': 'إضافة قائمة',
    'sidebar.tvGuide': 'دليل التلفزيون',
    'sidebar.categories': 'الأقسام',
    'sidebar.favorites': 'المفضلة',
    'sidebar.allChannels': 'جميع القنوات',
    'sidebar.allMovies': 'جميع الأفلام',
    'sidebar.allSeries': 'جميع المسلسلات',
    'sidebar.collapse': 'طي',
    'sidebar.settings': 'الإعدادات',

    // Channel Grid
    'grid.liveTelevision': 'البث التلفزيوني المباشر',
    'grid.videoOnDemand': 'الفيديو حسب الطلب',
    'grid.tvSeries': 'المسلسلات التلفزيونية',
    'grid.channels': 'قناة',
    'grid.movies': 'فيلم',
    'grid.series': 'مسلسل',
    'grid.sortAZ': 'أ-ي',
    'grid.sortRecent': 'الأحدث',
    'grid.sortMostWatched': 'الأكثر مشاهدة',
    'grid.searchChannels': 'بحث عن قنوات...',
    'grid.searchMovies': 'بحث عن أفلام...',
    'grid.searchSeries': 'بحث عن مسلسلات...',
    'grid.continueWatching': 'متابعة المشاهدة',
    'grid.clearAll': 'مسح الكل',
    'grid.noFound': 'لم يتم العثور على {label}',
    'grid.tryDifferent': 'جرب فئة أو بحث مختلف',

    // Player
    'player.selectChannel': 'اختر قناة للمشاهدة',
    'player.live': 'مباشر',
    'player.vod': 'فيديو حسب الطلب',
    'player.playbackError': 'خطأ في التشغيل',
    'player.openExternal': 'فتح في مشغل خارجي (mpv / VLC)',
    'player.installHEVC': 'تثبيت إضافة HEVC (متجر Windows)',
    'player.retry': 'إعادة المحاولة',
    'player.goBack': 'العودة',
    'player.configurePlayer': 'قم بإعداد mpv أو VLC في الإعدادات ← المشغل للتوافق الأفضل',
    'player.loading': 'جاري التحميل...',
    'player.audio': 'الصوت',
    'player.subtitles': 'الترجمة',
    'player.off': 'إيقاف',
    'player.alwaysShowResumePrompt': 'إظهار مطالبة الاستئناف دائماً',
    'player.alwaysShowResumePromptDesc':
      'عرض استئناف والبدء من جديد عند وجود موضع محفوظ، حتى عند إيقاف استئناف الأفلام.',

    // VOD Detail
    'vod.play': 'تشغيل',
    'vod.resume': 'استئناف',
    'vod.resumeFrom': 'استئناف من {time}',
    'vod.startOver': 'البدء من جديد',
    'vod.loadingDetails': 'جاري تحميل التفاصيل...',
    'vod.plot': 'القصة',
    'vod.director': 'المخرج',
    'vod.genre': 'النوع',
    'vod.releaseDate': 'تاريخ الإصدار',
    'vod.duration': 'المدة',
    'vod.cast': 'الممثلون',
    'vod.movie': 'فيلم',
    'vod.download': 'تنزيل على الجهاز',
    'vod.downloading': 'جاري التنزيل…',
    'vod.downloadingPct': 'جاري التنزيل… {pct}٪',
    'vod.downloadDone': 'تم حفظ الملف بنجاح.',
    'vod.downloadError': 'فشل التنزيل. حاول مرة أخرى أو تحقق من الاتصال.',
    'vod.downloadCancel': 'إلغاء التنزيل',
    'vod.downloadCanceled': 'تم إلغاء التنزيل.',
    'vod.stopDownload': 'إيقاف التنزيل',
    'vod.downloadGbPair': '{used} جيجابايت من {total} جيجابايت',
    'vod.downloadGbOnly': 'تم تنزيل {used} جيجابايت',
    'vod.downloadEtaPending': 'جاري تقدير الوقت المتبقي…',
    'vod.downloadEtaLine': '~{eta} متبقية',
    'vod.downloadEtaNoTotal': 'حجم الملف غير معروف — لا يمكن تقدير الوقت المتبقي.',
    'vod.etaSeconds': '{n} ث',
    'vod.etaMinutes': '{n} د',
    'vod.etaHoursMinutes': '{h} س {m} د',
    'vod.downloadDisclaimer':
      'للاستخدام الشخصي فقط. أنت مسؤول عن الالتزام بشروط المزود والقوانين المعمول بها.',

    // Series detail
    'series.resume': 'استئناف',
    'series.startOver': 'من البداية',

    // EPG
    'epg.title': 'دليل التلفزيون',
    'epg.channels': 'قناة',
    'epg.loading': 'جاري تحميل بيانات البرنامج...',
    'epg.catchUp': 'إعادة',
    'epg.clickCatchUp': 'انقر لمشاهدة الإعادة',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.back': 'رجوع',
    'settings.general': 'عام',
    'settings.playlists': 'قوائم التشغيل',
    'settings.appearance': 'المظهر',
    'settings.player': 'المشغل',
    'settings.shortcuts': 'الاختصارات',
    'settings.about': 'حول',

    // General Settings
    'general.title': 'عام',
    'general.subtitle': 'إعدادات بدء التشغيل وتفضيلات التطبيق.',
    'general.minimizeToTray': 'التصغير إلى شريط المهام',
    'general.minimizeToTrayDesc': 'الاستمرار في الخلفية عند إغلاق النافذة',
    'general.startMinimized': 'البدء مصغّراً',
    'general.startMinimizedDesc': 'تشغيل التطبيق مصغراً في شريط المهام',
    'general.language': 'اللغة',
    'general.languageDesc': 'اختر لغة التطبيق',
    'general.data': 'البيانات',
    'general.clearHistory': 'مسح سجل المشاهدة',

    // Playlist Settings
    'playlist.title': 'قوائم التشغيل',
    'playlist.subtitle': 'إدارة اتصالات مزودي IPTV.',
    'playlist.add': 'إضافة قائمة تشغيل',
    'playlist.serverUrl': 'رابط الخادم',
    'playlist.username': 'اسم المستخدم',
    'playlist.password': 'كلمة المرور',
    'playlist.nameOptional': 'الاسم (اختياري)',
    'playlist.addConnect': 'إضافة والاتصال',
    'playlist.cancel': 'إلغاء',
    'playlist.connecting': 'جاري الاتصال...',
    'playlist.activate': 'تفعيل',
    'playlist.edit': 'تعديل',
    'playlist.test': 'اختبار',
    'playlist.delete': 'حذف',
    'playlist.confirmDelete': 'هل أنت متأكد؟ لا يمكن التراجع.',
    'playlist.saveChanges': 'حفظ التغييرات',
    'playlist.saving': 'جاري الحفظ...',
    'playlist.active': 'نشط',
    'playlist.noPlaylists': 'لا توجد قوائم تشغيل',
    'playlist.addAbove': 'أضف قائمة تشغيل أعلاه للبدء',
    'playlist.expires': 'ينتهي',
    'playlist.maxConnections': 'الحد الأقصى',
    'playlist.activeConnections': 'نشط',

    // About
    'about.title': 'حول',
    'about.subtitle': 'مشغل StreamFlow IPTV',
    'about.version': 'الإصدار',
    'about.platform': 'المنصة',
    'about.updates': 'التحديثات',
    'about.checkUpdates': 'التحقق من التحديثات',
    'about.checking': 'جاري التحقق من التحديثات...',
    'about.updateAvailable': 'يتوفر تحديث',
    'about.downloadUpdate': 'تحميل التحديث',
    'about.downloading': 'جاري تحميل التحديث...',
    'about.updateReady': 'تم تحميل التحديث وهو جاهز للتثبيت',
    'about.restartUpdate': 'إعادة التشغيل للتحديث',
    'about.builtWith': 'تم بناؤه باستخدام Electron و React و Tailwind CSS',

    // Login
    'login.addPlaylist': 'إضافة قائمة تشغيل',
    'login.enterCredentials': 'أدخل بيانات اعتماد إكستريم كودز',
    'login.playlistName': 'اسم القائمة',
    'login.connect': 'اتصال',
    'login.connectionFailed': 'فشل الاتصال. تحقق من رابط الخادم وبيانات الاعتماد.',
    'login.backToPlayer': 'العودة إلى المشغل',
    'login.tagline': 'مشغلك المتميز للبث المباشر والأفلام والمسلسلات.',
  },
}

let currentLang: Language = 'en'

export function setLanguage(lang: Language) {
  currentLang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

export function getLanguage(): Language {
  return currentLang
}

export function t(key: string, params?: Record<string, string>): string {
  let text = translations[currentLang]?.[key] ?? translations.en[key] ?? key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v)
    })
  }
  return text
}

export function isRTL(): boolean {
  return currentLang === 'ar'
}
