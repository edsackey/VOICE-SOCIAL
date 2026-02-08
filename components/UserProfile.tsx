
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, CallType } from '../types';
import { StorageService } from '../services/storageService';

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

  useEffect(() => {
    if (isOpen) {
      setEditedUser({
        ...user,
        profileImages: user.profileImages || ['', '', ''],
      });
      setIsEditing(false);
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

  const handleSubscribe = () => {
    StorageService.toggleSubscription(myId, user.id);
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

  const displayUser = isEditing ? editedUser : user;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[#f7f3e9] rounded-[48px] overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 pb-20 custom-scrollbar">
          {/* Banner Section */}
          <div className="relative h-60 bg-indigo-200 group shrink-0 overflow-hidden">
            <img 
              src={displayUser.bannerImage || `https://picsum.photos/seed/banner_${user.id}/1200/600`} 
              className="w-full h-full object-cover" 
              alt="Banner" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#f7f3e9]/80" />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center gap-4">
                <label className="bg-black/60 px-6 py-3 rounded-full flex items-center gap-3 cursor-pointer text-white text-[10px] font-black uppercase hover:bg-black/80 transition-all shadow-xl">
                  Change Banner
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'bannerImage')} />
                </label>
              </div>
            )}
            <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 shadow-2xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="px-10 -mt-20 relative">
            {/* Avatar & Main Actions */}
            <div className="flex justify-between items-end mb-8">
              <div className="relative group">
                <div className="w-40 h-40 rounded-[40px] border-[12px] border-[#f7f3e9] bg-white overflow-hidden shadow-2xl">
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
                  <button 
                    onClick={isEditing ? handleSave : () => setIsEditing(true)} 
                    className={`bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${isSaving ? 'opacity-50' : ''}`}
                  >
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    {isSaving ? 'SAVING...' : isEditing ? 'SAVE CHANGES' : 'EDIT PROFILE'}
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onInitiateCall?.(user, 'voice')}
                      className="p-4 bg-indigo-600 text-white rounded-[24px] shadow-xl hover:scale-110 active:scale-95 transition-all border-2 border-indigo-700"
                      title="Voice Call"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </button>
                    <button 
                      onClick={() => onInitiateCall?.(user, 'video')}
                      className="p-4 bg-white text-indigo-600 rounded-[24px] shadow-xl border-2 border-indigo-100 hover:border-indigo-600 transition-all active:scale-95"
                      title="Video Call"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    <button onClick={handleFollow} className={`${isFollowing ? 'bg-white text-indigo-600 border-2 border-indigo-100' : 'bg-gray-900 text-white border-2 border-gray-800'} px-10 py-4 rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all`}>
                      {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Header Text */}
            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2 uppercase">{displayUser.name}</h2>
              <div className="flex gap-8 items-center">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-gray-900 leading-none">{followers.length.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-gray-900 leading-none">{following.length.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">following</span>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-12">
              {/* Bio Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Biography</h3>
                </div>
                {isEditing ? (
                  <textarea 
                    className="w-full bg-white rounded-[32px] p-6 text-sm border-none shadow-xl min-h-[140px] focus:ring-4 focus:ring-indigo-50 transition-all font-medium" 
                    value={editedUser.bio} 
                    onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})} 
                  />
                ) : (
                  <div className="bg-white p-7 rounded-[40px] shadow-sm border border-gray-100">
                    <p className="text-gray-700 leading-relaxed font-medium">{user.bio || "No bio added yet."}</p>
                  </div>
                )}
              </section>

              {/* Gallery Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Visual Gallery</h3>
                  {isEditing && <span className="text-[9px] text-gray-400 font-bold uppercase">Up to 3 Photos</span>}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(displayUser.profileImages || ['', '', '']).map((img, idx) => (
                    <div key={idx} className="aspect-square bg-white rounded-[32px] overflow-hidden border-2 border-indigo-50 shadow-sm relative group">
                      {img ? (
                        <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      {isEditing && (
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                           <span className="text-[10px] text-white font-black uppercase bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Change</span>
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profileImages', idx)} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Voice Note Section */}
              <section className="bg-indigo-600 p-10 rounded-[56px] shadow-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-1">Welcome Intro</h3>
                    <p className="text-[9px] text-indigo-200 font-bold uppercase">30 Second Max Recording</p>
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
                      <audio controls className="flex-1 h-8 filter brightness-125 contrast-125" src={displayUser.welcomeVoiceNote} />
                    </div>
                  ) : !isEditing && <p className="text-sm opacity-50 italic">No greeting recorded for this profile.</p>}
                  
                  {isEditing && (
                    <button 
                      onMouseDown={startRecording} 
                      onMouseUp={stopRecording} 
                      className={`p-10 rounded-[40px] shadow-2xl transition-all active:scale-95 ${isRecording ? 'bg-red-500 scale-110 shadow-red-500/50' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                      title="Hold to Record"
                    >
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-1.93z" clipRule="evenodd" /></svg>
                    </button>
                  )}
                </div>
              </section>

              {/* Individual Dashboard Section: Recent Echoes */}
              {isOwnProfile && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Recent Echoes</h3>
                  </div>
                  <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          </div>
                          <div>
                             <p className="text-sm font-black text-gray-900">Incoming Echo</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Sarah Chen • 12 mins ago</p>
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Missed</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </div>
                          <div>
                             <p className="text-sm font-black text-gray-900">Outgoing Visual Echo</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Dev Sarah • Yesterday</p>
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">14m 22s</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Past Rooms Section */}
              <section className="pb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Session History</h3>
                </div>
                <div className="space-y-4">
                  {user.pastRooms?.map(room => (
                    <div key={room.id} className="bg-white p-6 rounded-[32px] flex items-center justify-between border border-gray-100 group/room hover:border-indigo-100 transition-all">
                      <div>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Live Stage</p>
                        <p className="text-sm font-black text-gray-900 line-clamp-1">{room.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">{room.date}</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover/room:bg-indigo-600 group-hover/room:text-white transition-all shadow-inner">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                      </div>
                    </div>
                  ))}
                  {(!user.pastRooms || user.pastRooms.length === 0) && (
                    <div className="py-12 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                       <p className="text-xs text-gray-400 italic font-medium uppercase tracking-widest">No previous rooms on record</p>
                    </div>
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
