import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Activity, ChevronRight, UserCheck } from 'lucide-react';
import loginImg from '../assets/login.png';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const res = await login(username, password);
      if (!res.success) { setError(res.error); setLoading(false); }
    } else {
      if (!displayName) { setError('Display name is required.'); setLoading(false); return; }
      const res = await register(username, password, displayName);
      if (!res.success) { setError(res.error); setLoading(false); }
    }
  };

  return (
    <div className="min-h-screen flex bg-page">
      {/* Left decorative panel - shown on larger screens */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-primary-light border-r border-primary-olive/30">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0 z-0 bg-primary-wine">
          <img 
            src={loginImg} 
            alt="Connecta Hero" 
            className="w-full h-full object-cover opacity-80" 
          />
          {/* Dark overlay to enhance text readability */}
          <div className="absolute inset-0 bg-black/35 z-0"></div>
        </div>

        {/* Brand badge - glassmorphic layout for maximum readability */}
        <div className="relative z-10 flex items-center gap-3 self-start bg-primary-wine/80 backdrop-blur-md py-2 px-4 rounded-xl border border-white/20 shadow-md">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center border border-white/10">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-white text-md font-bold tracking-tight">Connecta</span>
        </div>

        {/* Softer taglines and hero description wrapped in readable card */}
        <div className="relative z-10 bg-primary-wine/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 max-w-md shadow-lg">
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Where conversations<br />become connections.
          </h2>
          <p className="text-white/90 text-[14.5px] leading-relaxed font-medium">
            Connect with people who share your interests. Share posts, chats, and vibes instantly on Connecta.
          </p>
        </div>

        <p className="relative z-10 text-white/90 text-[11px] font-semibold bg-primary-wine/80 backdrop-blur-md py-1.5 px-3.5 rounded-lg border border-white/15 self-start shadow-sm">
          &copy; 2026 Connecta Inc.
        </p>
      </div>

      {/* Right auth form panel */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary-wine flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-primary-light" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary-dark">Connecta</span>
          </div>

          <div className="app-card p-7 md:p-8">
            {/* Tab toggle */}
            <div className="flex rounded-xl bg-primary-light/70 p-1 mb-6 border border-primary-olive/30">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2.5 text-center font-bold text-[13px] rounded-lg transition-all cursor-pointer ${
                  isLogin ? 'bg-primary-wine text-white shadow-sm' : 'text-primary-dark/70 hover:text-primary-wine'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2.5 text-center font-bold text-[13px] rounded-lg transition-all cursor-pointer ${
                  !isLogin ? 'bg-primary-wine text-white shadow-sm' : 'text-primary-dark/70 hover:text-primary-wine'
                }`}
              >
                Create Account
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-primary-dark mb-1">
              {isLogin ? 'Welcome back 👋' : 'Join Connecta'}
            </h2>
            <p className="text-[13px] text-primary-olive mb-6">
              {isLogin ? 'Sign in to access your feed and chat.' : 'No email required! Sign up with a username and display name.'}
            </p>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-primary-wine/10 border border-primary-wine/30 text-primary-wine text-[13px] font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
                    Your Full Name / Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
                      <User className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full input-field input-with-icon text-[14px]"
                    />
                  </div>
                  <p className="text-[10px] text-primary-olive/80 mt-1">
                    This is your public display name shown on your profile and posts.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
                  {isLogin ? 'Username' : 'Choose a Username (Unique)'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
                    <UserCheck className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. sarah_codes"
                    className="w-full input-field input-with-icon text-[14px]"
                  />
                </div>
                {!isLogin && (
                  <p className="text-[10px] text-primary-olive/80 mt-1">
                    Only letters, numbers, and underscores. Used to log in (No email needed).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full input-field input-with-icon text-[14px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 mt-2 group"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>
            </form>

            {isLogin && (
              <div className="mt-6 p-4 rounded-xl bg-primary-light border border-primary-olive/30 text-center">
                <p className="text-[11px] text-primary-wine font-semibold mb-2">
                  Demo Accounts (Password: <span className="font-mono font-bold text-primary-wine bg-white/70 px-1.5 py-0.5 rounded">password123</span>)
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['sarah_codes', 'alex_design', 'elena_writes', 'marcus_dev'].map((u) => (
                    <button
                      key={u}
                      onClick={() => setUsername(u)}
                      className="text-[11px] font-bold text-primary-dark bg-white border border-primary-olive/40 px-2.5 py-1 rounded-lg hover:border-primary-wine hover:text-primary-wine hover:bg-primary-wine/5 transition-all cursor-pointer"
                    >
                      @{u}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
