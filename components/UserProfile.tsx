
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, CallType, Locale, CallRecord } from '../types';
import { StorageService } from '../services/storageService';
import LanguagePicker from './LanguagePicker';
import CallHistory from './CallHistory';
import { useLocale } from './LocaleContext';

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

const LANGUAGES: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
  { code: 'am', name: 'Amharic', flag: '🇪ቲ' },
  { code: 'wo', name: 'Wolof', flag: '🇸🇳' },
];

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [trigger, setTrigger] = useState(0); 
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  const followers = StorageService.getFollowers(user.id);
  const following = StorageService.getFollowing(user.id);
  const myId = localStorage.getItem('vrl_current_uid') || 'me';
  const isFollowing = StorageService.isFollowing(myId, user.id);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEditedUser({
        ...user,
        profileImages: user.profileImages || ['', '', ''],
      });
      setIsEditing(false);
      setCallHistory(StorageService.getCallHistory(user.id));
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isRecording && recordTime >= 30) {
      stopRecording();
    }
  }, [recordTime, isRecording]);

  if (!isOpen) return null;

  const handleFollow = () => {
    StorageService.toggleFollow(myId, user.id);
    setTrigger(t => t + 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'bannerImage' | 'avatar' | 'profileImages', index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (field === 'profileImages' && index !== undefined) {
          const newImages = [...(editedUser.profileImages || ['', '', ''])];
          newImages[index] = result;
          setEditedUser({ ...editedUser, profileImages: newImages });
        } else {
          setEditedUser({ ...editedUser, [field]: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setEditedUser(prev => ({ ...prev, welcomeVoiceNote: reader.result as string }));
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = window.setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    onUpdateProfile?.(editedUser);
    setTimeout(() => {
      setIsEditing(false);
      setIsSaving(false);
    }, 500);
  };

  const canModerate = (viewerRole === UserRole.HOST || viewerRole === UserRole.MODERATOR) && !isOwnProfile;

  const displayUser = isEditing ? editedUser : user;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-secondary rounded-[48px] overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 pb-20 no-scrollbar">
          {/* Banner Section */}
          <div className="relative h-60 bg-accent/20 group shrink-0 overflow-hidden">
            <img 
              src={displayUser.bannerImage || `https://picsum.photos/seed/banner_${user.id}/1200/600`} 
              className="w-full h-full object-cover" 
              alt="Banner" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-secondary/80" />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center gap-4">
                <label className="bg-black/60 px-6 py-3 rounded-full flex items-center gap-3 cursor-pointer text-white text-[10px] font-black uppercase hover:bg-black/80 transition-all shadow-xl">
                  Change Banner
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'bannerImage')} />
                </label>
              </div>
            )}
            <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 shadow-2xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="px-10 -mt-20 relative">
            {/* Avatar & Main Actions */}
            <div className="flex justify-between items-end mb-8">
              <div className="relative group">
                <div className="w-40 h-40 rounded-[40px] border-[12px] border-secondary bg-main overflow-hidden shadow-2xl">
                  <img src={displayUser.avatar} className="w-full h-full object-cover" alt={user.name} />
                </div>
                {isEditing && (
                  <label className="absolute inset-3 bg-black/50 rounded-[40px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                     <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     <span className="text-[10px] text-white font-black uppercase">Update</span>
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                  </label>
                )}
              </div>
              
              <div className="flex gap-4 mb-3">
                {isOwnProfile ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsCallHistoryOpen(true)}
                      className="p-4 bg-white/5 border border-white/10 rounded-[24px] text-muted hover:text-white transition-all shadow-xl"
                      title="Call History"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button 
                      onClick={isEditing ? handleSave : () => setIsEditing(true)} 
                      className={`bg-accent text-white px-10 py-4 rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${isSaving ? 'opacity-50' : ''}`}
                    >
                      {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                      {isSaving ? 'SAVING...' : isEditing ? 'SAVE CHANGES' : 'EDIT PROFILE'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onInitiateCall?.(user, 'voice')}
                      className="p-4 bg-accent text-white rounded-[24px] shadow-xl hover:scale-110 active:scale-95 transition-all"
                      title="Voice Call"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </button>
                    <button onClick={handleFollow} className={`${isFollowing ? 'bg-white text-accent border-2 border-accent/20' : 'bg-accent text-white'} px-10 py-4 rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all`}>
                      {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-10">
              <div className="flex justify-between items-start">
                <h2 className="text-4xl font-black text-main tracking-tight mb-2 uppercase">{displayUser.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Native:</span>
                  <button 
                    onClick={() => setIsLangPickerOpen(true)}
                    className="bg-accent/10 text-accent px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-accent/20 hover:bg-accent hover:text-white transition-all"
                  >
                    {displayUser.nativeLanguage?.toUpperCase() || 'EN'}
                  </button>
                </div>
              </div>
              <div className="flex gap-8 items-center mt-2">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-main leading-none">{followers.length.toLocaleString()}</span>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-main leading-none">{following.length.toLocaleString()}</span>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">following</span>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {/* Moderation Panel */}
              {canModerate && onModerateUser && (
                <section className="bg-red-500/5 p-8 rounded-[48px] border border-red-500/10 shadow-inner group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-[12px] font-black text-red-600 uppercase tracking-[0.4em] mb-1">Moderation Shield</h3>
                      <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest italic">Live Stage Authority</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    {user.handRaised && (
                       <button 
                        onClick={() => {
                          onModerateUser(user.id, 'role', UserRole.SPEAKER);
                          onClose();
                        }}
                        className="col-span-2 p-6 rounded-[32px] bg-yellow-400 text-white shadow-xl shadow-yellow-400/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 mb-2"
                      >
                        <span className="text-2xl">✋</span>
                        <span className="text-xs font-black uppercase tracking-widest">Invite User to Speak</span>
                      </button>
                    )}

                    <button 
                      onClick={() => onModerateUser(user.id, 'mute')}
                      className={`p-5 rounded-3xl transition-all border flex flex-col items-center gap-2 ${user.isMuted ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-red-100 text-red-600 hover:bg-red-50'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">{user.isMuted ? 'Unmute' : 'Mute Stage'}</span>
                    </button>
                    
                    <button 
                      onClick={() => onModerateUser(user.id, 'kick')}
                      className="p-5 rounded-3xl bg-white border border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all flex flex-col items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">Expel Hub</span>
                    </button>

                    <button 
                      onClick={() => onModerateUser(user.id, 'role', user.role === UserRole.LISTENER ? UserRole.SPEAKER : UserRole.LISTENER)}
                      className="col-span-2 p-5 rounded-3xl bg-white border border-red-100 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-4"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {user.role === UserRole.LISTENER ? 'Move to Stage (Speaker)' : 'Move to Audience (Listener)'}
                      </span>
                    </button>
                  </div>
                </section>
              )}

              {/* Refined Volume Mixer */}
              {!isOwnProfile && onVolumeChange && (
                <section className="bg-[var(--accent)]/5 p-10 rounded-[48px] border border-[var(--accent)]/10 shadow-inner group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h3 className="text-[12px] font-black text-[var(--accent)] uppercase tracking-[0.4em] mb-1">Personal Mixer</h3>
                      <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Tailor your audio feed</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-[var(--accent)]/10">
                        <span className="text-xs font-black text-[var(--accent)] tabular-nums">{Math.round(localVolume * 100)}%</span>
                      </div>
                      <div className={`p-3 rounded-2xl transition-all ${localVolume === 0 ? 'bg-red-100 text-red-500' : 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'}`}>
                         {localVolume === 0 ? (
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                         ) : (
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                         )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative h-12 flex items-center group/slider">
                    <input 
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={localVolume}
                      onChange={(e) => onVolumeChange(user.id, parseFloat(e.target.value))}
                      className="w-full h-3 bg-[var(--accent)]/10 rounded-full appearance-none accent-[var(--accent)] cursor-pointer transition-all hover:h-4"
                    />
                  </div>
                  
                  <div className="flex justify-between mt-4 px-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Minimal</span>
                      <span className="text-[7px] font-bold text-[var(--accent)]/40 uppercase">0.0x</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-[var(--accent)] uppercase tracking-widest">Normal</span>
                      <div className="w-1 h-1 bg-[var(--accent)] rounded-full mt-1" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Amplified</span>
                      <span className="text-[7px] font-bold text-[var(--accent)]/40 uppercase">1.5x</span>
                    </div>
                  </div>
                </section>
              )}

              {isOwnProfile && (
                <section className="bg-main/30 p-8 rounded-[40px] border border-white/5 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-black text-accent uppercase tracking-[0.3em]">App Language</h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  </div>
                  <div className="relative">
                    <select 
                      value={locale}
                      onChange={(e) => setLocale(e.target.value as Locale)}
                      className="w-full bg-secondary text-main border-2 border-white/10 rounded-[24px] px-6 py-4 font-bold text-sm focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none appearance-none cursor-pointer transition-all"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <p className="mt-3 text-[9px] text-muted font-bold uppercase tracking-widest px-2">Changes apply immediately and persist in your browser.</p>
                </section>
              )}

              <section>
                <h3 className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mb-4">Biography</h3>
                {isEditing ? (
                  <textarea 
                    className="w-full bg-main rounded-[32px] p-6 text-sm border-2 border-white/5 shadow-xl min-h-[140px] focus:border-accent/30 transition-all font-medium text-main outline-none" 
                    value={editedUser.bio} 
                    onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})} 
                  />
                ) : (
                  <div className="bg-main p-7 rounded-[40px] shadow-sm border border-white/5">
                    <p className="text-main leading-relaxed font-medium">{user.bio || "No bio added yet."}</p>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mb-4">Past Rooms</h3>
                {user.pastRooms && user.pastRooms.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {user.pastRooms.map(room => (
                      <div key={room.id} className="bg-main/50 p-6 rounded-[32px] border border-white/5 hover:border-accent/30 transition-all group/room">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1">{room.date}</p>
                            <h4 className="text-sm font-bold text-main uppercase group-hover/room:text-accent transition-colors">{room.title}</h4>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover/room:bg-accent group-hover/room:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-main/30 p-8 rounded-[40px] border border-white/5 text-center">
                    <p className="text-xs font-bold text-muted uppercase tracking-widest">No room history available.</p>
                  </div>
                )}
              </section>

              <section className="bg-accent p-10 rounded-[56px] shadow-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-1">Welcome Intro</h3>
                    <p className="text-[9px] text-white/60 font-bold uppercase">30 Second Max Recording</p>
                  </div>
                  {isEditing && isRecording && (
                    <div className="flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-full animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-[10px] font-black uppercase tabular-nums">00:{recordTime.toString().padStart(2, '0')} / 00:30</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  {displayUser.welcomeVoiceNote ? (
                    <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-[32px] border border-white/10 flex items-center gap-4">
                      <audio controls className="flex-1 h-8 filter brightness-125 invert" src={displayUser.welcomeVoiceNote} />
                    </div>
                  ) : !isEditing && <p className="text-sm opacity-50 italic text-white/70">No greeting recorded for this profile.</p>}
                  
                  {isEditing && (
                    <button 
                      onMouseDown={startRecording} 
                      onMouseUp={stopRecording} 
                      className={`p-10 rounded-[40px] shadow-2xl transition-all active:scale-95 ${isRecording ? 'bg-red-500 scale-110 shadow-red-500/50' : 'bg-white text-accent hover:bg-white/90'}`}
                      title="Hold to Record"
                    >
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H7a1 1 0 100 2h6a1 1 0 1010-2h-1.93z" clipRule="evenodd" /></svg>
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <LanguagePicker isOpen={isLangPickerOpen} onClose={() => setIsLangPickerOpen(false)} />
      {isCallHistoryOpen && (
        <CallHistory 
          history={callHistory} 
          onClose={() => setIsCallHistoryOpen(false)} 
          currentUserId={user.id} 
        />
      )}
    </div>
  );
};

export default UserProfile;
