
import React, { useState, useEffect } from 'react';
import { Room, User, UserRole, DBUser } from './types';
import DiscoveryView from './components/DiscoveryView';
import LiveRoom from './components/LiveRoom';
import UserProfile from './components/UserProfile';
import ViralLaunchpad from './components/ViralLaunchpad';
import PodcastArchive from './components/PodcastArchive';
import AuthView from './components/AuthView';
import FeedView from './components/FeedView';
import MyFilesView from './components/MyFilesView';
import ScheduleView from './components/ScheduleView';
import GroupsView from './components/GroupsView';
import PublicRoomPlayer from './components/PublicRoomPlayer';
import CreatorStudio from './components/CreatorStudio';
import { useLocale } from './components/LocaleContext';
import { CURRENT_USER as MOCK_CURRENT_USER, MOCK_ROOMS } from './constants';
import { auth } from './services/firebase';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { StorageService } from './services/storageService';

const PROFILE_STORAGE_KEY = 'voiceroomlive_profile_data';
const VOLUMES_STORAGE_KEY = 'voiceroomlive_local_volumes';

const App: React.FC = () => {
  const { t } = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'feed' | 'files' | 'schedule' | 'groups' | 'creator'>('rooms');
  const [isPublicListenerMode, setIsPublicListenerMode] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_CURRENT_USER;
  });

  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(VOLUMES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('public') === 'true') {
      setIsPublicListenerMode(true);
      setActiveRoom(MOCK_ROOMS[0]);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true);
        let storedDbUser = StorageService.getUser(user.uid);
        if (!storedDbUser) {
          storedDbUser = {
            id: user.uid,
            username: user.email?.split('@')[0] || `user_${Date.now()}`,
            email: user.email || '',
            createdAt: Date.now(),
            displayName: currentUser.name !== 'John Doe' ? currentUser.name : (user.email?.split('@')[0] || 'New User'),
            bio: currentUser.bio,
            profilePictureUrl: currentUser.avatar
          };
          StorageService.saveUser(storedDbUser);
        }
        setDbUser(storedDbUser);

        if (currentUser.name === 'John Doe') {
          setCurrentUser(prev => ({ 
            ...prev, 
            id: user.uid,
            name: storedDbUser!.displayName,
            role: UserRole.HOST 
          }));
        }
      } else {
        setIsAuthenticated(false);
        setDbUser(null);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(currentUser));
    if (dbUser) {
      StorageService.saveUser({
        ...dbUser,
        displayName: currentUser.name,
        bio: currentUser.bio,
        profilePictureUrl: currentUser.avatar
      });
    }
  }, [currentUser, dbUser]);

  useEffect(() => {
    localStorage.setItem(VOLUMES_STORAGE_KEY, JSON.stringify(userVolumes));
  }, [userVolumes]);

  const handleJoinRoom = (room: Room) => {
    setActiveRoom(room);
  };

  const handleExitRoom = () => {
    setActiveRoom(null);
    if (isPublicListenerMode) {
      setIsPublicListenerMode(false);
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const handleProfileUpdate = (data: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...data }));
  };

  const handleVolumeChange = (userId: string, volume: number) => {
    setUserVolumes(prev => ({ ...prev, [userId]: volume }));
  };

  const handleCreateRoom = (newRoom: Room) => {
    const roomWithSelf = {
      ...newRoom,
      speakers: [{ ...currentUser, role: UserRole.HOST }]
    };
    handleJoinRoom(roomWithSelf);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#f7f3e9] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="mt-8 text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] animate-pulse">Initializing VOICE SOCIAL Global...</p>
      </div>
    );
  }

  if (isPublicListenerMode && activeRoom) {
    return <PublicRoomPlayer room={activeRoom} onClose={handleExitRoom} />;
  }

  if (!isAuthenticated) {
    return <AuthView onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f3e9] flex flex-col">
      {activeRoom ? (
        <LiveRoom 
          room={activeRoom} 
          onExit={handleExitRoom} 
          onUserClick={setSelectedUser}
          userVolumes={userVolumes}
          onVolumeChange={handleVolumeChange}
          currentUser={currentUser}
        />
      ) : (
        <>
          <nav className="bg-white/70 backdrop-blur-xl p-4 sticky top-0 z-30 border-b border-white/50 shadow-sm">
             <div className="max-w-7xl mx-auto flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl shadow-indigo-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>
                  <span className="text-xl font-black text-gray-900 tracking-tighter uppercase">{t('app_name')}</span>
               </div>
               
               <div className="hidden lg:flex bg-[#f7f3e9]/50 rounded-[20px] p-1 border border-gray-100">
                 {[
                   { id: 'rooms', label: t('rooms') },
                   { id: 'schedule', label: t('schedule') },
                   { id: 'groups', label: t('groups') },
                   { id: 'feed', label: t('pulse') },
                   { id: 'creator', label: t('creator_studio'), highlight: true },
                   { id: 'files', label: t('files') }
                 ].map((tab) => (
                   <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md' : tab.highlight ? 'text-indigo-400 hover:text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     {tab.label} {tab.highlight && '💎'}
                   </button>
                 ))}
               </div>

               <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setIsArchiveOpen(true)}
                   className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:scale-110 active:scale-95 transition-all text-gray-800"
                   title="Vault"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                 </button>
                 <div 
                   className="relative cursor-pointer group"
                   onClick={() => setSelectedUser(currentUser)}
                 >
                   <div className="w-11 h-11 rounded-[38%] overflow-hidden border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                      <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Me" />
                   </div>
                   <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-4 border-white" />
                 </div>
               </div>
             </div>
          </nav>
          
          <main className="flex-1 max-w-7xl mx-auto w-full">
            <div className="animate-in fade-in duration-700">
              {activeTab === 'rooms' ? (
                dbUser && <DiscoveryView onJoinRoom={handleJoinRoom} onCreateRoomClick={() => setIsLaunchpadOpen(true)} currentUser={dbUser} />
              ) : activeTab === 'schedule' ? (
                dbUser && <ScheduleView currentUser={dbUser} />
              ) : activeTab === 'groups' ? (
                dbUser && <GroupsView currentUser={dbUser} />
              ) : activeTab === 'feed' ? (
                dbUser && <FeedView currentUser={dbUser} />
              ) : activeTab === 'creator' ? (
                dbUser && <CreatorStudio currentUser={dbUser} />
              ) : (
                <MyFilesView />
              )}
            </div>
          </main>

          {/* Bottom Nav for Mobile */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
             {['rooms', 'schedule', 'creator', 'feed'].map(t_id => (
               <button 
                key={t_id}
                onClick={() => setActiveTab(t_id as any)}
                className={`p-3 rounded-2xl transition-all ${activeTab === t_id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}
               >
                  {t_id === 'rooms' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                  {t_id === 'schedule' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  {t_id === 'creator' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {t_id === 'feed' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L5 21V5a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3z" /></svg>}
               </button>
             ))}
          </div>
        </>
      )}

      {selectedUser && (
        <UserProfile 
          user={selectedUser.id === currentUser.id ? currentUser : selectedUser}
          isOwnProfile={selectedUser.id === currentUser.id}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateProfile={handleProfileUpdate}
          localVolume={userVolumes[selectedUser.id] ?? 1}
          onVolumeChange={handleVolumeChange}
          viewerRole={currentUser.role}
        />
      )}

      <ViralLaunchpad 
        isOpen={isLaunchpadOpen}
        onClose={() => setIsLaunchpadOpen(false)}
        onLaunch={handleCreateRoom}
      />

      <PodcastArchive 
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
      />
    </div>
  );
};

export default App;
