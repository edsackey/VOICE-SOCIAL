
import React, { useMemo, useState } from 'react';
import { StorageService } from '../services/storageService';
import { DBUser } from '../types';
import { useLocale } from './LocaleContext';

interface CreatorStudioProps {
  currentUser: DBUser;
  onLaunchHub?: () => void;
}

const CreatorStudio: React.FC<CreatorStudioProps> = ({ currentUser, onLaunchHub }) => {
  const { t, formatCurrency } = useLocale();
  const donations = StorageService.getAllDonations();
  const [filter, setFilter] = useState<'ALL' | 'DPO' | 'MOMO'>('ALL');

  const filteredDonations = useMemo(() => {
    if (filter === 'ALL') return donations;
    if (filter === 'DPO') return donations.filter(d => d.paymentMethod === 'DPO_CARD');
    return donations.filter(d => d.paymentMethod === 'MTN_MOMO');
  }, [donations, filter]);

  const stats = useMemo(() => {
    const totalUSD = donations.filter(d => d.currency === 'USD').reduce((acc, curr) => acc + curr.amount, 0);
    const totalGHS = donations.filter(d => d.currency === 'GHS').reduce((acc, curr) => acc + curr.amount, 0);
    const dpoCount = donations.filter(d => d.paymentMethod === 'DPO_CARD').length;
    const momoCount = donations.filter(d => d.paymentMethod === 'MTN_MOMO').length;

    return {
      totalUSD,
      totalGHS,
      dpoCount,
      momoCount,
      avgUSD: donations.length ? (totalUSD / donations.length) : 0,
      totalTx: donations.length
    };
  }, [donations]);

  return (
    <div className="max-w-7xl mx-auto p-6 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2">Creator Hub</h1>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.5em] ml-1">Strategic Financial Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
            onClick={onLaunchHub}
            className="bg-[var(--accent)] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
           >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Start Live Hub
           </button>
           <div className="flex bg-white/50 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-white/50">
              {['ALL', 'DPO', 'MOMO'].map((f) => (
                <button
                 key={f}
                 onClick={() => setFilter(f as any)}
                 className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Hero Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
         <div className="bg-slate-900 rounded-[56px] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-8">Estimated Revenue</p>
            <div className="space-y-2">
              <h3 className="text-4xl font-black tabular-nums tracking-tighter">{formatCurrency(stats.totalUSD, 'USD')}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Plus {formatCurrency(stats.totalGHS, 'GHS')}</p>
            </div>
            <div className="mt-12 flex items-center gap-2 text-green-400">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Live Updates Active</span>
            </div>
         </div>

         <div className="bg-white rounded-[56px] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-white relative group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-10">Gateway Analytics</p>
            <div className="space-y-8">
               <div>
                 <div className="flex justify-between text-[10px] font-black mb-3">
                   <span className="text-indigo-600 tracking-widest">DPO GROUP (CARD)</span>
                   <span>{stats.totalTx ? Math.round((stats.dpoCount / stats.totalTx) * 100) : 0}%</span>
                 </div>
                 <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${(stats.dpoCount / (stats.totalTx || 1)) * 100}%` }} />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-[10px] font-black mb-3">
                   <span className="text-yellow-600 tracking-widest">REGIONAL WALLETS</span>
                   <span>{stats.totalTx ? Math.round((stats.momoCount / stats.totalTx) * 100) : 0}%</span>
                 </div>
                 <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${(stats.momoCount / (stats.totalTx || 1)) * 100}%` }} />
                 </div>
               </div>
            </div>
         </div>

         <div className="bg-indigo-600 rounded-[56px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
            <div>
               <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] mb-2">Payout Capacity</p>
               <h3 className="text-4xl font-black tabular-nums tracking-tighter">Verified</h3>
            </div>
            <button className="mt-8 w-full bg-white/20 backdrop-blur-md py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-indigo-600 transition-all border border-white/10 shadow-xl">
               Execute Global Payout
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Detailed Ledger */}
         <div className="lg:col-span-2 bg-white rounded-[64px] shadow-sm border border-white/50 overflow-hidden">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
               <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Transaction Ledger</h3>
               <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all">Export JSON</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-50">
                       <th className="px-10 py-6">Identity</th>
                       <th className="px-10 py-6">Timestamp</th>
                       <th className="px-10 py-6">Gateway</th>
                       <th className="px-10 py-6 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-10 py-32 text-center text-gray-300 italic text-[10px] uppercase tracking-[0.3em]">No data records found</td>
                      </tr>
                    ) : (
                      filteredDonations.map(d => (
                        <tr key={d.id} className="hover:bg-indigo-50/20 transition-colors group">
                           <td className="px-10 py-7">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    ID
                                 </div>
                                 <span className="text-xs font-bold text-gray-800">Support Node {d.senderId.slice(0, 5)}</span>
                              </div>
                           </td>
                           <td className="px-10 py-7 text-[10px] text-gray-400 font-bold uppercase tabular-nums">
                              {new Date(d.createdAt).toLocaleString()}
                           </td>
                           <td className="px-10 py-7">
                              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${d.paymentMethod === 'MTN_MOMO' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                 {d.paymentMethod.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="px-10 py-7 text-right font-black text-gray-900 text-sm tabular-nums">
                              {formatCurrency(d.amount, d.currency)}
                           </td>
                        </tr>
                      ))
                    )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Audience Engagement Sidebar */}
         <div className="bg-slate-900 rounded-[64px] p-10 text-white flex flex-col border border-white/5">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-12">Audience Health</h3>
            
            <div className="flex-1 space-y-12">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Reach</p>
                     <p className="text-xs font-black text-indigo-400">+1.2k</p>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: '85%' }} />
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention Index</p>
                     <p className="text-xs font-black text-green-400">92.4%</p>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
                  </div>
               </div>

               <div className="mt-12 bg-white/5 p-8 rounded-[40px] border border-white/5 space-y-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Listener Distribution</p>
                  <div className="flex items-end justify-between h-32 gap-1.5 px-2">
                     {[30, 50, 40, 90, 100, 80, 60, 45, 70, 40, 55, 30].map((h, i) => (
                       <div key={i} className={`flex-1 rounded-full ${h > 70 ? 'bg-indigo-500' : 'bg-slate-700'} transition-all duration-700`} style={{ height: `${h}%` }} />
                     ))}
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                     <span>GMT</span>
                     <span>EST</span>
                     <span>JST</span>
                  </div>
               </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Top Supporter Region</p>
               <span className="text-indigo-400 font-black text-xs uppercase tracking-widest">Africa / Europe</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CreatorStudio;
