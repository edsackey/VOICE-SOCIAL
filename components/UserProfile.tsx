
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, UserRole, CallType, Locale, CallRecord } from '../types';
import { StorageService } from '../services/storageService';
import LanguagePicker from './LanguagePicker';
import CallHistory from './CallHistory';
import { useLocale } from './LocaleContext';
import { auth } from '../services/firebase';
import { signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

interface UserProfileProps {
  user: User;
  isOwnProfile: boolean;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile?: (updatedData: Partial<User>) => void;
  onInitiateCall?: (user: User, type: CallType) => void;
  localVolume?: number;
  onVolumeChange?: (userId: string, volume: number) => void;
  viewerRole: UserRole;
  onModerateUser?: (userId: string, action: 'mute' | 'kick' | 'role', value?: any) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  isOwnProfile, 
  isOpen, 
  onClose, 
  onUpdateProfile,
  onInitiateCall,
  localVolume = 1,
  onVolumeChange,
  viewerRole,
  onModerateUser
}) => {
  const { locale, setLocale } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // Compute stats from the source of truth
  const stats = useMemo(() => {
    const followers = StorageService.getFollowers(user.id);
    const following = StorageService.getFollowing(user.id);
    const myId = 'me'; 
    const isFollowing = StorageService.isFollowing(myId, user.id);
    
    return {
      followerCount: followers.length,
      followingCount: following.length,
      isFollowing
    };
  }, [user.id, refreshTrigger]);

  useEffect(() => {
    if (isOpen) {
      setEditedUser({
        ...user,
        profileImages: user.profileImages || ['', '', ''],
      });
      setIsEditing(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFollow = () => {
    const myId = 'me';
    StorageService.toggleFollow(myId, user.id);
    
    if (!stats.isFollowing) {
      StorageService.saveNotification({
        id: `follow-${Date.now()}`,
        type: 'FOLLOW',
        title: 'New Hub Connection',
        message: `Someone just linked with your node!`,
        timestamp: Date.now(),
        isRead: false,
        senderAvatar: 'https://picsum.photos/seed/someone/200'
      });
    }

    setRefreshTrigger(prev => prev + 1);
  };

  const handleSave = async () => {
    setIsSaving(true);
    onUpdateProfile?.(editedUser);
    setTimeout(() => {
      setIsEditing(false);
      setIsSaving(false);
    }, 500);
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to disconnect from EchoHub?")) {
      setIsLoggingOut(true);
      try {
        await signOut(auth);
        onClose();
      } catch (error) {
        console.error("Logout failed", error);
        setIsLoggingOut(false);
      }
    }
  };

  const isModerator = user.role === UserRole.MODERATOR || user.role === UserRole.HOST;
  const canModerate = (viewerRole === UserRole.HOST || viewerRole === UserRole.MODERATOR) && !isOwnProfile;
  const isHostViewer = viewerRole === UserRole.HOST;

  const displayUser = isEditing ? editedUser : user;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-secondary rounded-[64px] overflow-hidden shadow-[0_64px_128px_rgba(0,0,0,0.5)] relative max-h-[92vh] flex flex-col border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 pb-20 no-scrollbar">
          {/* Banner Section */}
          <div className="relative h-64 bg-accent/20 group shrink-0 overflow-hidden">
            <img 
              src={displayUser.bannerImage || `https://picsum.photos/seed/banner_${user.id}/1200/600`} 
              className="w-full h-full object-cover transition-transform duration-[4000ms] group-hover:scale-110" 
              alt="Banner" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-secondary" />
            <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 shadow-2xl transition-all border border-white/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="px-12 -mt-24 relative">
            {/* Avatar & Main Actions */}
            <div className="flex justify-between items-end mb-10">
              <div className="relative group">
                <div className="w-48 h-48 rounded-[56px] border-[14px] border-secondary bg-main overflow-hidden shadow-2xl transition-all group-hover:shadow-accent/20 relative">
                  <img src={displayUser.avatar} className="w-full h-full object-cover" alt={user.name} />
                  {stats.followerCount > 100 && (
                    <div className="absolute inset-0 border-4 border-accent rounded-[42px] pointer-events-none opacity-40" />
                  )}
                </div>
              </div>
              
              <div className="flex gap-4 mb-4">
                {isOwnProfile ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsCallHistoryOpen(true)}
                      className="p-5 bg-white/5 border border-white/10 rounded-[28px] text-muted hover:text-white transition-all shadow-xl"
                      title="Call History"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button 
                      onClick={isEditing ? handleSave : () => setIsEditing(true)} 
                      className={`bg-accent text-white px-12 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_40px_rgba(24,119,242,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${isSaving ? 'opacity-50' : ''}`}
                    >
                      {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                      {isSaving ? 'SYNCING...' : isEditing ? 'COMMIT CHANGES' : 'REFINE ID'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onInitiateCall?.(user, 'voice')}
                      className="p-5 bg-accent text-white rounded-[28px] shadow-2xl hover:scale-110 active:scale-95 transition-all"
                      title="Direct Hub Link"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </button>
                    <button onClick={handleFollow} className={`${stats.isFollowing ? 'bg-white/10 text-accent border border-accent/30' : 'bg-accent text-white shadow-2xl shadow-accent/40'} px-12 py-5 rounded-[28px] font-black hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.3em] text-[11px]`}>
                      {stats.isFollowing ? 'Linked' : '+ Link Hub'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-12">
              <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <h2 className="text-5xl font-black text-main tracking-tighter uppercase italic">{displayUser.name}</h2>
                      {isModerator && (
                        <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-500/30">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          {displayUser.role === UserRole.HOST ? 'Session Host' : 'Stage Moderator'}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted font-bold uppercase tracking-[0.4em] ml-1 opacity-60">Neural Node ID: {displayUser.id.toUpperCase().slice(0, 10)}</p>
                  </div>
                  
                  <div className="flex items-center gap-10">
                     <div className="flex flex-col">
                        <span className="text-3xl font-black text-main tabular-nums leading-none mb-2 tracking-tighter">{stats.followerCount.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em] opacity-40">Tribal Nodes</span>
                     </div>
                     <div className="w-px h-10 bg-white/5" />
                     <div className="flex flex-col">
                        <span className="text-3xl font-black text-main tabular-nums leading-none mb-2 tracking-tighter">{stats.followingCount.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em] opacity-40">Connected</span>
                     </div>
                  </div>
              </div>
            </div>

            <div className="space-y-12">
              {/* Refined Moderation Panel */}
              {canModerate && onModerateUser && (
                <section className="bg-red-600/5 p-10 rounded-[56px] border border-red-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-[60px] -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
                  <h3 className="text-[11px] font-black text-red-500 uppercase tracking-[0.5em] mb-8 relative z-10 flex items-center gap-4">
                    <span className="w-10 h-0.5 bg-red-500" /> 
                    Node Orchestration
                  </h3>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <button 
                      onClick={() => onModerateUser(user.id, 'mute')}
                      className={`p-7 rounded-[32px] transition-all border-2 flex flex-col items-center justify-center gap-3 ${user.isMuted ? 'bg-red-600 border-red-600 text-white shadow-2xl shadow-red-900/40' : 'bg-white/5 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500'}`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{user.isMuted ? 'Unmute' : 'Mute stage'}</span>
                    </button>
                    
                    <button 
                      onClick={() => onModerateUser(user.id, 'kick')}
                      className="p-7 rounded-[32px] bg-white/5 border-2 border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex flex-col items-center justify-center gap-3"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Expel node</span>
                    </button>

                    <button 
                      onClick={() => onModerateUser(user.id, 'role', user.role === UserRole.LISTENER ? UserRole.SPEAKER : UserRole.LISTENER)}
                      className="col-span-2 p-7 rounded-[32px] bg-white border border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-6"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                        {user.role === UserRole.LISTENER ? 'Promote to Stage Voice' : 'Demote to Gallery'}
                      </span>
                    </button>
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-[11px] font-black text-accent uppercase tracking-[0.5em] mb-6 flex items-center gap-4">
                  <span className="w-8 h-1 bg-accent rounded-full" /> Personal Blueprint
                </h3>
                <div className="bg-main/30 p-10 rounded-[56px] shadow-inner border border-white/5 relative overflow-hidden group">
                  <p className="text-xl text-main leading-relaxed font-medium relative z-10 italic">"{user.bio || "No auditory greeting has been broadcasted by this node yet."}"</p>
                </div>
              </section>

              <section className="bg-accent p-12 rounded-[64px] shadow-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-[80px] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-[3000ms]" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] mb-8 relative z-10 opacity-70">Sonic Introduction</h3>
                <div className="relative z-10">
                  {displayUser.welcomeVoiceNote ? (
                    <div className="bg-white/10 backdrop-blur-3xl p-6 rounded-[40px] border border-white/20 flex items-center gap-6 shadow-2xl">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent shadow-xl">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                      </div>
                      <audio controls className="flex-1 h-8 filter brightness-125 invert opacity-60" src={displayUser.welcomeVoiceNote} />
                    </div>
                  ) : (
                    <div className="text-center w-full py-6 border-2 border-dashed border-white/20 rounded-[40px]">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Awaiting voice recording...</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Termination Action for the user */}
              {isOwnProfile && (
                <section className="pt-6 border-t border-white/5">
                  <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full py-6 bg-red-600/10 text-red-500 rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] border border-red-600/20 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    )}
                    Terminate Session
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isCallHistoryOpen && (
        <CallHistory 
          history={StorageService.getCallHistory(user.id)} 
          onClose={() => setIsCallHistoryOpen(false)} 
          currentUserId="me" 
        />
      )}
    </div>
  );
};

export default UserProfile;
