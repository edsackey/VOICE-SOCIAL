
import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { useLocale } from './LocaleContext';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle: string;
  senderId: string;
  onSuccess: (amount: number, currency: string) => void;
}

const AMOUNTS = [5, 20, 50, 100, 250, 500];
const CURRENCIES = [
  { code: 'USD', label: 'Global (USD)', flag: '🌐' },
  { code: 'EUR', label: 'Europe (EUR)', flag: '🇪🇺' },
  { code: 'GBP', label: 'UK (GBP)', flag: '🇬🇧' },
  { code: 'GHS', label: 'Ghana (GHS)', flag: '🇬🇭' },
  { code: 'NGN', label: 'Nigeria (NGN)', flag: '🇳🇬' },
  { code: 'KES', label: 'Kenya (KES)', flag: '🇰🇪' }
];

type PaymentMethod = 'DPO_CARD' | 'MTN_MOMO' | 'PAYPAL';

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, roomId, roomTitle, senderId, onSuccess }) => {
  const { formatCurrency } = useLocale();
  const [step, setStep] = useState<'amount' | 'method' | 'processing' | 'momo_input'>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DPO_CARD');
  const [momoNumber, setMomoNumber] = useState('');
  const [message, setMessage] = useState<string>('');

  if (!isOpen) return null;

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleNextStep = () => {
    if (step === 'amount') setStep('method');
    else if (step === 'method' && paymentMethod === 'MTN_MOMO') setStep('momo_input');
    else if (step === 'method') initiateCheckout();
    else if (step === 'momo_input') initiateMomoPush();
  };

  const initiateCheckout = () => {
    setStep('processing');
    setTimeout(() => completeTransaction(), 3000);
  };

  const initiateMomoPush = () => {
    if (!momoNumber) return;
    setStep('processing');
    setTimeout(() => completeTransaction(), 4000);
  };

  const completeTransaction = () => {
    StorageService.saveDonation({
      id: `${paymentMethod.toLowerCase()}-${Date.now()}`,
      senderId,
      roomId,
      amount: finalAmount,
      currency,
      paymentMethod: paymentMethod === 'PAYPAL' ? 'DPO_CARD' : paymentMethod as any,
      phoneNumber: paymentMethod === 'MTN_MOMO' ? momoNumber : undefined,
      message,
      createdAt: Date.now()
    });
    onSuccess(finalAmount, currency);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep('amount');
    setCustomAmount('');
    setMomoNumber('');
    onClose();
  };

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 z-[600] bg-slate-900 flex items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="text-center space-y-12 max-w-sm">
           <div className="relative">
              <div className="w-28 h-28 bg-white rounded-[40px] mx-auto flex items-center justify-center shadow-[0_32px_64px_rgba(0,0,0,0.3)] animate-bounce">
                {paymentMethod === 'MTN_MOMO' ? (
                  <img src="https://logowik.com/content/uploads/images/mtn-mobile-money8896.jpg" className="w-16 object-contain" alt="MTN" />
                ) : paymentMethod === 'PAYPAL' ? (
                   <img src="https://cdn-icons-png.flaticon.com/512/174/174861.png" className="w-14 object-contain" alt="PayPal" />
                ) : (
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                )}
              </div>
              <div className="absolute -inset-6 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
           </div>
           
           <div className="space-y-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Secure Connection
              </h2>
              <p className="text-indigo-200 text-sm font-medium opacity-70">
                {paymentMethod === 'MTN_MOMO' 
                  ? `Authenticating with ${momoNumber}...`
                  : 'Redirecting to global payment gateway...'}
              </p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[600] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#f7f3e9] rounded-[56px] overflow-hidden shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 bg-white flex justify-between items-center">
           <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                {step === 'amount' && 'Support Creator'}
                {step === 'method' && 'Select Gateway'}
                {step === 'momo_input' && 'Mobile Wallet'}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{roomTitle}</p>
           </div>
           <button onClick={resetAndClose} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="p-8 space-y-8">
           {step === 'amount' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar gap-1">
                  {CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`shrink-0 flex items-center gap-2 py-2 px-4 rounded-xl transition-all ${currency === c.code ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                      <span className="text-sm">{c.flag}</span>
                      <span className="text-[10px] font-black">{c.code}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-5 rounded-3xl text-[11px] font-black transition-all ${selectedAmount === amt && !customAmount ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-200'}`}
                    >
                      {formatCurrency(amt, currency).replace(/\.00$/, '')}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-sm">{currency}</span>
                  <input 
                    type="number"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="Enter custom amount"
                    className="w-full bg-white border-none rounded-[32px] p-6 pl-16 text-gray-800 font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
             </div>
           )}

           {step === 'method' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <button 
                  onClick={() => setPaymentMethod('DPO_CARD')}
                  className={`w-full p-6 rounded-[36px] border-2 flex items-center gap-6 transition-all ${paymentMethod === 'DPO_CARD' ? 'bg-indigo-50 border-indigo-600 shadow-xl' : 'bg-white border-gray-100 hover:border-indigo-100'}`}
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Credit / Debit Card</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Processed via DPO Global</p>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod('MTN_MOMO')}
                  className={`w-full p-6 rounded-[36px] border-2 flex items-center gap-6 transition-all ${paymentMethod === 'MTN_MOMO' ? 'bg-yellow-50 border-yellow-400 shadow-xl' : 'bg-white border-gray-100 hover:border-yellow-100'}`}
                >
                  <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <img src="https://logowik.com/content/uploads/images/mtn-mobile-money8896.jpg" className="w-12 object-contain" alt="MTN" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Mobile Wallet</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Direct MoMo/M-Pesa STK Push</p>
                  </div>
                </button>
             </div>
           )}

           <div className="space-y-4">
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Attach a professional shoutout..."
                className="w-full bg-white border-none rounded-[36px] p-8 text-sm font-medium shadow-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none h-24"
              />
              <button 
                onClick={handleNextStep}
                className={`w-full py-7 rounded-[36px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${paymentMethod === 'MTN_MOMO' && step !== 'amount' ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-yellow-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
              >
                {step === 'amount' ? 'Continue →' : 'Authorize Transaction'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
