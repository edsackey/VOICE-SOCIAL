
import React, { useState, useEffect } from 'react';
import { EchoGroup, DBUser } from '../types';
import { StorageService } from '../services/storageService';
import BroadcastModal from './BroadcastModal';

interface GroupsViewProps {
  currentUser: DBUser;
}

const GroupsView: React.FC<GroupsViewProps> = ({ currentUser }) => {
  const [groups, setGroups] = useState<EchoGroup[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<EchoGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    setGroups(StorageService.getGroups());
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: EchoGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      description: newGroupDesc,
      ownerId: currentUser.id,
      memberIds: [currentUser.id] // Start with just the owner
    };

    StorageService.saveGroup(newGroup);
    setNewGroupName('');
    setNewGroupDesc('');
    setIsCreateModalOpen(false);
    loadGroups();
    showToast(`Group "${newGroup.name}" created!`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-32">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 font-bold text-sm">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">My Groups</h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Connect with your Tribes</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          New Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {groups.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-30">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <p className="text-sm font-black uppercase tracking-widest">You haven't joined or created any groups</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="bg-white rounded-[48px] p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center text-2xl font-black shadow-inner">
                  {group.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {group.memberIds.length} Members
                  </span>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{group.name}</h3>
              <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed line-clamp-2">{group.description}</p>
              
              <div className="mt-auto pt-6 border-t border-gray-50 flex gap-3">
                <button 
                  onClick={() => setSelectedGroup(group)}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  Broadcast
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[600] bg-indigo-950/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setIsCreateModalOpen(false)}>
          <div className="w-full max-w-md bg-[#f7f3e9] rounded-[48px] p-10 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8 text-center">Establish a Tribe</h2>
            <form onSubmit={handleCreateGroup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Group Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="The Tech Hub, Design Daily, etc."
                  className="w-full bg-white border-none rounded-2xl p-5 text-gray-800 font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Purpose / Bio</label>
                <textarea 
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  placeholder="What is this group about?"
                  className="w-full bg-white border-none rounded-3xl p-6 text-sm font-medium shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all resize-none h-32"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedGroup && (
        <BroadcastModal 
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          roomTitle={selectedGroup.name}
          participants={selectedGroup.memberIds.map(id => ({ id, name: `Member ${id.slice(0,4)}` }))}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};

export default GroupsView;
