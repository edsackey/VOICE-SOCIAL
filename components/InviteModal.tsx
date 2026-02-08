
import React, { useState } from 'react';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Jordan Sparks', avatar: 'https://picsum.photos/seed/f1/200', online: true },
  { id: 'f2', name: 'Casey Wright', avatar: 'https://picsum.photos/seed/f2/200', online: true },
  { id: 'f3', name: 'Taylor Reed', avatar: 'https://picsum.photos/seed/f3/200', online: false },
  { id: 'f4', name: 'Riley Blue', avatar: 'https://picsum.photos/seed/f4/200', online: true },
  { id: 'f5', name: 'Morgan Free', avatar: 'https://picsum.photos/seed/f5/200', online: false },
];

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  onShowToast: (msg: string) => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, roomTitle, onShowToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleInvite = (id: string, name: string) => {
    setInvitedIds(prev => new Set(prev).add(id));
    onShowToast(`Invite sent to ${name.split(' ')[0]}!`);
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    onShowToast('Room link copied to clipboard!');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me on VOICE ROOM LIVE!`,
          text: `I'm in a live room: "${roomTitle}". Come join the conversation!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  const filteredFriends = MOCK_FRIENDS.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-[#f7f3e9] rounded-t-[40px] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Invite people</h2>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search friends..." 
            className="w-full bg-white border-none rounded-2xl py-3 pl-11 pr-4 text-gray-700 focus:ring-2 focus:ring-indigo-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-8">
          {filteredFriends.map(friend => (
            <div key={friend.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-[35%] object-cover shadow-sm" />
                  {friend.online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#f7f3e9] rounded-full" />}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{friend.name}</p>
                  <p className="text-xs text-gray-400">{friend.online ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <button 
                onClick={() => handleInvite(friend.id, friend.name)}
                disabled={invitedIds.has(friend.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  invitedIds.has(friend.id) 
                  ? 'bg-gray-200 text-gray-400 cursor-default' 
                  : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 shadow-sm'
                }`}
              >
                {invitedIds.has(friend.id) ? 'Sent' : 'Invite'}
              </button>
            </div>
          ))}
          {filteredFriends.length === 0 && (
            <p className="text-center text-gray-400 py-8">No friends found</p>
          )}
        </div>

        <div className="flex gap-4">
           <button 
             onClick={handleCopyLink}
             className="flex-1 bg-white text-gray-900 py-4 rounded-2xl font-bold border border-gray-100 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2"
           >
             <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
             Copy Link
           </button>
           
           {navigator.share && (
             <button 
               onClick={handleNativeShare}
               className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 flex items-center justify-center gap-2"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
               Share
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
