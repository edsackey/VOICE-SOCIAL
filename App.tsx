
import React, { useState, useEffect } from 'react';
import { Room, User, UserRole, DBUser, ActiveCall, CallType, AppTheme, Locale, EchoNotification } from './types';
import DiscoveryView from './components/DiscoveryView';
import LiveRoom from './components/LiveRoom';
import UserProfile from './components/UserProfile';
import ViralLaunchpad from './components/ViralLaunchpad';
import PodcastArchive from './components/PodcastArchive';
import AuthView from './components/AuthView';
import FeedView from './components/FeedView';
import ScheduleView from './components/ScheduleView';
import GroupsView from './components/GroupsView';
import PublicRoomPlayer from './components/PublicRoomPlayer';
import CreatorStudio from './components/CreatorStudio';
import CallsView from './components/CallsView';
import CallOverlay from './components/CallOverlay';
import LanguagePicker from './components/LanguagePicker';
import VoiceAssistant from './components/VoiceAssistant';
import NotificationsPanel from './components/NotificationsPanel';
import NotificationToast from './components/NotificationToast';
import { useLocale } from './components/LocaleContext';
import { CURRENT_USER as MOCK_CURRENT_USER, MOCK_ROOMS } from './constants';
import { auth } from './services/firebase';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { StorageService } from './services/storageService';

const PROFILE_STORAGE_KEY = 'echohub_profile_data';
const THEME_STORAGE_KEY = 'echohub_theme_pref';
const THEMES: AppTheme[] = ['midnight', 'light', 'blue', 'sunset'];

const App: React.FC = () => {
  const { locale, t } = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'feed' | 'schedule' | 'groups' | 'creator' | 'calls'>('rooms');
  const [isPublicListenerMode, setIsPublicListenerMode] = useState(false);
  
  const [notifications, setNotifications] = useState<EchoNotification[]>([]);
  const [currentToast, setCurrentToast] = useState<EchoNotification | null>(null);

  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({});

  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved as AppTheme) || 'midnight';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_CURRENT_USER;
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshNotifications = () => {
    setNotifications(StorageService.getNotifications());
  };

  useEffect(() => {
    refreshNotifications();
    const handleNewNotif = (e: any) => {
      const notif = e.detail;
      setCurrentToast(notif);
      refreshNotifications();
    };
    window.addEventListener('echo_new_notification', handleNewNotif);
    return () => window.removeEventListener('echo_new_notification', handleNewNotif);
  }, []);

  const toggleTheme = () => {
    const nextIndex = (THEMES.indexOf(theme) + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  };

  const handleVolumeChange = (userId: string, volume: number) => {
    setUserVolumes(prev => ({ ...prev, [userId]: volume }));
  };

  const handleModerateUser = (userId: string, action: 'mute' | 'kick' | 'role', value?: any) => {
    if (!activeRoom) return;
    let updatedRoom = { ...activeRoom };
    if (action === 'kick') {
      updatedRoom.speakers = updatedRoom.speakers.filter(s => s.id !== userId);
      updatedRoom.listeners = updatedRoom.listeners.filter(l => l.id !== userId);
      if (selectedUser?.id === userId) setSelectedUser(null);
    } else if (action === 'mute') {
      updatedRoom.speakers = updatedRoom.speakers.map(s => s.id === userId ? { ...s, isMuted: !s.isMuted } : s);
    }
    setActiveRoom(updatedRoom);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-main flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-accent uppercase tracking-[0.5em] animate-pulse">EchoHub Neural Engine</p>
      </div>
    );
  }

  if (isPublicListenerMode && activeRoom) {
    return <PublicRoomPlayer room={activeRoom} onClose={() => { setActiveRoom(null); setIsPublicListenerMode(false); }} />;
  }

  if (!isAuthenticated) return <AuthView onAuthenticated={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-main text-main selection:bg-accent selection:text-white transition-colors duration-500">
      <VoiceAssistant onNavigate={setActiveTab} onMuteToggle={() => {}} onOpenCreationPortal={() => setIsLaunchpadOpen(true)} />
      <NotificationToast notification={currentToast} onClose={() => setCurrentToast(null)} />

      {activeCall && <CallOverlay call={activeCall} onEndCall={() => setActiveCall(null)} currentUser={currentUser} />}

      {activeRoom ? (
        <LiveRoom 
          room={activeRoom} 
          onExit={() => setActiveRoom(null)} 
          onUserClick={setSelectedUser}
          userVolumes={userVolumes}
          onVolumeChange={handleVolumeChange}
          currentUser={currentUser}
        />
      ) : (
        <div className="pb-32">
          <nav className="p-6 sticky top-0 z-50 glass transition-all duration-300">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 rotate-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </div>
                <span className="text-xl font-black tracking-tighter uppercase italic">{t('app_name')}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button onClick={() => setIsNotificationsOpen(true)} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all relative">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                   {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-secondary shadow-lg animate-pulse">{unreadCount}</span>}
                </button>
                <button onClick={() => setIsLangPickerOpen(true)} className="px-4 py-2 bg-accent/10 rounded-2xl border border-accent/20 text-accent font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all hidden sm:block">
                  {t('native_lang')}: {locale.toUpperCase()}
                </button>
                <button onClick={toggleTheme} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
                  {theme === 'midnight' ? '🌙' : '☀️'}
                </button>
                <button onClick={() => setIsArchiveOpen(true)} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                </button>
                <div onClick={() => setSelectedUser(currentUser)} className="w-10 h-10 squircle overflow-hidden border-2 border-accent cursor-pointer hover:scale-110 transition-transform">
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-5xl mx-auto px-6 pt-6 animate-in fade-in duration-500">
            {activeTab === 'rooms' && <DiscoveryView onJoinRoom={setActiveRoom} onCreateRoomClick={() => setIsLaunchpadOpen(true)} currentUser={currentUser as any} />}
            {activeTab === 'feed' && <FeedView currentUser={currentUser as any} />}
            {activeTab === 'schedule' && <ScheduleView currentUser={currentUser as any} />}
            {activeTab === 'calls' && <CallsView onJoinRoom={setActiveRoom} onInitiateCall={(u, t) => setActiveCall({id:'1', type:t, participants:[currentUser, u], startTime:Date.now()})} onUserClick={setSelectedUser} />}
            {activeTab === 'groups' && <GroupsView currentUser={currentUser as any} />}
            {activeTab === 'creator' && <CreatorStudio currentUser={currentUser as any} onLaunchHub={() => setIsLaunchpadOpen(true)} />}
          </main>

          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-6">
            <div className="glass rounded-[32px] p-2 flex justify-between items-center border border-white/10 shadow-2xl transition-all duration-300">
              {[
                { id: 'rooms', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { id: 'calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                { id: 'creator', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { id: 'feed', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994_0 01-1.414-.586m0 0L5 21V5a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3z' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`p-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-muted hover:text-main'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <UserProfile 
          user={selectedUser} 
          isOwnProfile={selectedUser.id === currentUser.id} 
          isOpen={true} 
          onClose={() => setSelectedUser(null)} 
          viewerRole={currentUser.role}
          localVolume={userVolumes[selectedUser.id] ?? 1}
          onVolumeChange={handleVolumeChange}
          onModerateUser={handleModerateUser}
        />
      )}

      <ViralLaunchpad 
        isOpen={isLaunchpadOpen} 
        onClose={() => setIsLaunchpadOpen(false)} 
        currentUser={currentUser}
        onLaunch={(r) => { setActiveRoom(r); setIsLaunchpadOpen(false); }} 
      />
      <PodcastArchive isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} />
      <LanguagePicker isOpen={isLangPickerOpen} onClose={() => setIsLangPickerOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} onRefresh={refreshNotifications} />
    </div>
  );
};

export default App;
