
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from '../services/firebase';

interface AuthViewProps {
  onAuthenticated: () => void;
}

type AuthMode = 'login' | 'register' | 'verify';

const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setVerifyEmail(email);
      await signOut(auth);
      setMode('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setVerifyEmail(email);
        await signOut(auth);
        setMode('verify');
      } else {
        onAuthenticated();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onAuthenticated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3e9] p-6">
        <div className="w-full max-w-md bg-white rounded-[48px] p-12 shadow-2xl text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-indigo-100 rounded-[32px] flex items-center justify-center text-indigo-600 mx-auto mb-8">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Verify Email</h2>
          <p className="text-gray-500 font-medium leading-relaxed mb-10">
            We have sent you a verification email to <span className="text-indigo-600 font-bold">{verifyEmail}</span>. Please verify it and log in.
          </p>
          <button 
            onClick={() => setMode('login')}
            className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f3e9] p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-[56px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-500 border border-white/50 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 text-white p-4 rounded-[24px] shadow-2xl shadow-indigo-100 mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase tracking-[0.05em]">VOICE SOCIAL</h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">Next-Gen Social Audio</p>
        </div>

        <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest text-center mb-8 bg-gray-50 py-3 rounded-2xl border border-gray-100">
          {mode === 'login' ? 'Welcome Back' : 'Join the Tribe'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-5 rounded-[24px] text-xs font-bold mb-6 border border-red-100 flex items-center gap-3 animate-in shake duration-300">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4 mb-8">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-6">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-[28px] p-5 text-sm font-bold text-gray-800 transition-all focus:ring-8 focus:ring-indigo-50/50 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-6">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-[28px] p-5 text-sm font-bold text-gray-800 transition-all focus:ring-8 focus:ring-indigo-50/50 outline-none"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 group"
          >
            {loading ? 'Processing...' : (
              <span className="flex items-center justify-center gap-2">
                {mode === 'login' ? 'Start Listening' : 'Launch Account'}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            )}
          </button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-white px-4 text-gray-300">Or continue with</span></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-100 text-gray-700 py-5 rounded-[28px] font-black uppercase tracking-widest text-[10px] shadow-sm hover:border-indigo-100 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-800 transition-colors"
          >
            {mode === 'login' ? "New to VOICE SOCIAL? Create Profile" : "Existing Member? Authenticate"}
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
         <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">VOICE SOCIAL Security Architecture v2.0</p>
      </div>
    </div>
  );
};

export default AuthView;
