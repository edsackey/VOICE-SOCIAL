
import React, { useState } from 'react';
import { ScheduledEvent, DBUser } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduledEvent;
  currentUser: DBUser;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, event, currentUser }) => {
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleBooking = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsBooked(true);
      setIsLoading(false);
    }, 1500);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[600] bg-indigo-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[#f7f3e9] rounded-[60px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        {!isBooked ? (
          <>
            <div className="h-64 relative">
               <img src={event.posterUrl} className="w-full h-full object-cover" alt="" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#f7f3e9] via-transparent to-black/20" />
               <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="p-10 -mt-12 relative bg-[#f7f3e9] rounded-t-[50px]">
               <div className="flex items-center gap-4 mb-6">
                  <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Limited Seats</div>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{event.duration} Live Room</span>
               </div>

               <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-4">{event.title}</h2>
               <p className="text-gray-500 font-medium mb-10 leading-relaxed">{event.description}</p>

               <div className="space-y-6 bg-white p-8 rounded-[40px] shadow-sm border border-indigo-50 mb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Starts at</p>
                        <p className="text-sm font-bold text-gray-900">{formatDate(event.startTime)}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <img src={event.hostAvatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                     <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Lead Moderator</p>
                        <p className="text-sm font-bold text-gray-900">{event.hostName}</p>
                     </div>
                  </div>
               </div>

               <button 
                onClick={handleBooking}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-8 rounded-[36px] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-4"
               >
                 {isLoading ? (
                   <>
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    Booking Seat...
                   </>
                 ) : 'Secure My Spot Now'}
               </button>
            </div>
          </>
        ) : (
          <div className="p-16 text-center animate-in zoom-in-95 duration-500">
             <div className="w-32 h-32 bg-green-500 rounded-[48px] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-green-100 relative">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <div className="absolute inset-0 bg-green-500 rounded-[48px] animate-ping opacity-20" />
             </div>
             <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">Seat Secured!</h2>
             <p className="text-gray-500 font-medium text-lg max-w-sm mx-auto mb-12">We've added this event to your personal EchoHub schedule. You'll get a notification 10 minutes before launch.</p>
             
             <div className="bg-white p-6 rounded-[32px] border border-green-100 mb-12">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ticket Reference</p>
                <p className="text-lg font-black text-indigo-600">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
             </div>

             <button 
              onClick={onClose}
              className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all"
             >
               Return to Schedule
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
