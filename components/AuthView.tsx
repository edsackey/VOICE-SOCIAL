
import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from '../services/firebase';
import { StorageService } from '../services/storageService';

interface AuthViewProps {
  onAuthenticated: () => void;
}

type AuthMode = 'login' | 'register' | 'verify';

const FEATURES = [
  {
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1200",
    title: "Chat-Chap Live",
    desc: "Broadcast your essence, find your frequency."
  },
  {
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200",
    title: "Bilingual Pulse",
    desc: "Simultaneous translation echoing across the globe."
  },
  {
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=1200",
    title: "Neural Archive",
    desc: "Every word archived and summarized by AI."
  }
];

const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [theme, setTheme] = useState<'midnight' | 'light'>(() => {
    return (localStorage.getItem('echohub_theme_pref') as any) || 'light';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('echohub_theme_pref', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureIndex(prev => (prev + 1) % FEATURES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'midnight' ? 'light' : 'midnight');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onAuthenticated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: displayName || username });
        StorageService.saveUser({
          id: user.uid,
          username: username.toLowerCase().replace(/\s/g, ''),
          email: email,
          createdAt: Date.now(),
          displayName: displayName || username,
          profilePictureUrl: `https://picsum.photos/seed/${user.uid}/200`
        });
        await sendEmailVerification(user);
        await signOut(auth);
        setMode('verify');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setMode('verify');
        } else {
          onAuthenticated();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] overflow-hidden relative p-4">
      <div className="absolute inset-0 z-0">
        {FEATURES.map((feat, idx) => (
          <div key={idx} className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${featureIndex === idx ? 'opacity-20 scale-100' : 'opacity-0 scale-110'}`}>
            <img src={feat.image} className="w-full h-full object-cover brightness-[0.5]" alt="" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-main)]/40 via-transparent to-[var(--bg-main)]" />
      </div>

      <button onClick={toggleTheme} className="fixed top-6 right-6 z-50 p-3 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all text-[var(--accent)]">
        {theme === 'midnight' ? '☀️' : '🌙'}
      </button>

      <div className="relative z-10 w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[var(--accent)] text-white rounded-2xl flex items-center justify-center mx-auto shadow-2xl mb-4">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[var(--accent)] uppercase italic">CHAT-CHAP</h1>
          <p className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest mt-1">Unified Voice Network</p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-[24px] shadow-2xl p-8 border border-[var(--glass-border)]">
          {mode === 'verify' ? (
            <div className="text-center py-6">
               <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               </div>
               <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Check your email</h3>
               <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">We sent a verification link to your email address. Verify your account to sign in to Chat-Chap.</p>
               <button onClick={() => setMode('login')} className="w-full bg-[var(--accent)] text-white py-4 rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-all active:scale-95">Back to Sign In</button>
            </div>
          ) : (
            <div className="space-y-6">
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs font-bold">{error}</div>}
              <form onSubmit={handleAuth} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-4">
                    <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full Name" className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-4 text-[var(--text-main)] font-semibold outline-none focus:border-[var(--accent)] transition-all" />
                    <input type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="Chat-Chap ID (Username)" className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-4 text-[var(--text-main)] font-semibold outline-none focus:border-[var(--accent)] transition-all" />
                  </div>
                )}
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-4 text-[var(--text-main)] font-semibold outline-none focus:border-[var(--accent)] transition-all" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Secure Password" className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-4 text-[var(--text-main)] font-semibold outline-none focus:border-[var(--accent)] transition-all" />
                <button type="submit" disabled={loading} className="w-full bg-[var(--accent)] text-white py-4 rounded-xl font-black uppercase text-sm shadow-xl hover:bg-[var(--accent-hover)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (mode === 'login' ? 'Enter Hub' : 'Join Network')}
                </button>
              </form>
              <div className="relative flex items-center py-2"><div className="flex-grow border-t border-[var(--glass-border)]"></div><span className="flex-shrink mx-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">or</span><div className="flex-grow border-t border-[var(--glass-border)]"></div></div>
              <button onClick={handleGoogleSignIn} disabled={loading} className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow border border-slate-200 hover:bg-slate-50 transition-all active:scale-98 disabled:opacity-50">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> Nexus Pass Sign In
              </button>
              <div className="text-center pt-4">
                 <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm font-bold text-[var(--accent)] hover:underline">
                   {mode === 'login' ? "New to Chat-Chap? Join now" : "Already have an account? Sign in"}
                 </button>
              </div>
            </div>
          )}
        </div>
        <p className="mt-12 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center opacity-40">Neural Node Protocol • v7.0 Global</p>
      </div>
    </div>
  );
};

export default AuthView;
