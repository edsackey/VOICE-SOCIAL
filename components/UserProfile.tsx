import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface UserProfileProps {
  user: User;
  isOwnProfile: boolean;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile?: (updatedData: Partial<User>) => void;
  localVolume?: number;
  onVolumeChange?: (userId: string, volume: number) => void;
  viewerRole: UserRole;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  isOwnProfile, 
  isOpen, 
  onClose, 
  onUpdateProfile,
  localVolume = 1,
  onVolumeChange,
  viewerRole
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [trigger, setTrigger] = useState(0); 

  const followers = StorageService.getFollowers(user.id);
  const following = StorageService.getFollowing(user.id);
  const myId = localStorage.getItem('vrl_current_uid') || 'me';
  const isFollowing = StorageService.isFollowing(myId, user.id);
  const isSubscribed = StorageService.isSubscribed(myId, user.id);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const canModerate = (viewerRole === UserRole.HOST || viewerRole === UserRole.MODERATOR) && !isOwnProfile;

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
    StorageService.toggleFollow(myId, user.id);
    setTrigger(t => t + 1);
  };

  const handleSubscribe = () => {
    StorageService.toggleSubscription(myId, user.id);
    setTrigger(t => t + 1);
  };

  const handleShare = async () => {
    const shareText = `Check out ${user.name}'s profile on VOICE ROOM LIVE! 🎙️`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} | EchoHub`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert("Profile link copied!");
    }
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
      timerRef.current = window.setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
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

  const handleMuteParticipant = () => {
    alert(`Participant ${user.name} has been remotely muted by Moderator.`);
    onClose();
  };

  const displayUser = isEditing ? editedUser : user;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[#f7f3e9] rounded-[48px] overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 pb-16">
          <div className="relative h-60 bg-indigo-200 group shrink-0 overflow-hidden">
            <img 
              src={displayUser.bannerImage || `https://picsum.photos/seed/banner_${user.id}/1200/600`} 
              className="w-full h-full object-cover" 
              alt="Banner" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#f7f3e9]/80" />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center gap-4">
                <label className="bg-black/60 px-6 py-3 rounded-full flex items-center gap-3 cursor-pointer text-white text-[10px] font-black uppercase">
                  Update Banner
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'bannerImage')} />
                </label>
              </div>
            )}
            <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 shadow-2xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="px-10 -mt-20 relative">
            <div className="flex justify-between items-end mb-8">
              <div className="relative group">
                <div className="w-40 h-40 rounded-[40px] border-[12px] border-[#f7f3e9] bg-white overflow-hidden shadow-2xl">
                  <img src={displayUser.avatar} className="w-full h-full object-cover" alt={user.name} />
                </div>
                {isEditing && (
                  <label className="absolute inset-3 bg-black/50 rounded-[40px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] text-white font-black uppercase">Avatar</span>
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                  </label>
                )}
              </div>
              
              <div className="flex gap-4 mb-3">
                {isOwnProfile ? (
                  <button onClick={isEditing ? handleSave : () => setIsEditing(true)} className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black shadow-2xl">
                    {isSaving ? 'Saving...' : isEditing ? 'SAVE' : 'EDIT'}
                  </button>
                ) : (
                  <div className="flex gap-3">
                    {canModerate && (
                      <button 
                        onClick={handleMuteParticipant}
                        className="p-4 bg-red-600 text-white rounded-[24px] shadow-xl hover:bg-red-700 transition-all"
                        title="Remote Mute Participant"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path fillRule="evenodd" d="M3.293 3.293a1 1 0 011.414 0L16.707 15.293a1 1 0 01-1.414 1.414l-12-12a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                    )}
                    <button onClick={handleSubscribe} className={`p-4 rounded-[24px] shadow-xl border-2 ${isSubscribed ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-400 border-gray-100'}`}>
                      <svg className={`w-6 h-6 ${isSubscribed ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </button>
                    <button onClick={handleFollow} className={`${isFollowing ? 'bg-white text-indigo-600 border-2 border-indigo-100' : 'bg-indigo-600 text-white border-2 border-indigo-700'} px-10 py-4 rounded-[24px] font-black shadow-2xl`}>
                      {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{displayUser.name}</h2>
              <div className="flex gap-8 items-center">
                <p className="text-sm font-black text-gray-900">{followers.length.toLocaleString()} <span className="text-gray-400 font-bold ml-1 text-xs uppercase">followers</span></p>
                <p className="text-sm font-black text-gray-900">{following.length.toLocaleString()} <span className="text-gray-400 font-bold ml-1 text-xs uppercase">following</span></p>
              </div>
              <p className="mt-2 text-[10px] font-black uppercase text-indigo-600 tracking-widest">Role: {displayUser.role}</p>
            </div>

            <div className="space-y-10">
              {!isOwnProfile && onVolumeChange && (
                <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Local Volume</h3>
                    <span className="text-xs font-black text-gray-900">{Math.round(localVolume * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={localVolume} onChange={(e) => onVolumeChange(user.id, parseFloat(e.target.value))} className="w-full h-2 bg-gray-100 rounded-lg appearance-none accent-indigo-600" />
                </section>
              )}

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Biography</h3>
                </div>
                {isEditing ? (
                  <textarea className="w-full bg-white rounded-[32px] p-6 text-sm border-none shadow-xl min-h-[140px]" value={editedUser.bio} onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})} />
                ) : (
                  <div className="bg-white p-7 rounded-[40px] shadow-sm">
                    <p className="text-gray-700 leading-relaxed font-medium">{user.bio || "No bio added yet."}</p>
                  </div>
                )}
              </section>

              <section className="bg-indigo-600 p-8 rounded-[48px] shadow-2xl text-white relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-black uppercase tracking-widest">Welcome Intro</h3>
                  {isEditing && isRecording && <span className="text-xs animate-pulse">REC 00:{recordTime.toString().padStart(2, '0')}</span>}
                </div>
                <div className="flex items-center gap-5">
                  {displayUser.welcomeVoiceNote ? (
                    <audio controls className="flex-1 h-10 filter invert" src={displayUser.welcomeVoiceNote} />
                  ) : !isEditing && <p className="text-sm opacity-50 italic">No greeting recorded.</p>}
                  {isEditing && (
                    <button onMouseDown={startRecording} onMouseUp={stopRecording} className={`p-6 rounded-[30px] transition-all ${isRecording ? 'bg-red-500' : 'bg-white text-indigo-600'}`}>
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-1.93z" clipRule="evenodd" /></svg>
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;