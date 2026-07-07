import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Activity, ChevronRight, UserCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Calendar, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import loginImg from '../assets/login.png';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pw) {
  if (!pw) return { label: '', score: 0 };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: 'Weak', score: 1 };
  if (score <= 3) return { label: 'Medium', score: 2 };
  return { label: 'Strong', score: 3 };
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);

  const { login, register } = useAuth();

  useEffect(() => {
    if (isLogin) {
      setUsernameStatus(null);
      setUsernameSuggestions([]);
      return;
    }

    const trimmed = username.trim();
    if (!trimmed || !/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameStatus(null);
      setUsernameSuggestions([]);
      return;
    }

    setUsernameStatus('checking');
    const handle = setTimeout(async () => {
      try {
        const res = await axios.get('/api/auth/check-username', { params: { username: trimmed } });
        if (res.data.available) {
          setUsernameStatus('available');
          setUsernameSuggestions([]);
        } else {
          setUsernameStatus('taken');
          setUsernameSuggestions(res.data.suggestions || []);
        }
      } catch (err) {
        setUsernameStatus(null);
        setUsernameSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [username, isLogin]);

  const validateStep1 = () => {
    if (!displayName || displayName.trim().length < 2) { 
      setError('Display name is required and must be at least 2 characters.'); 
      return false; 
    }
    if (!email || !EMAIL_PATTERN.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (usernameStatus === 'taken') {
      setError('That username is taken. Please pick one of the suggestions or try another.');
      return false;
    }
    if (usernameStatus === 'checking') {
      setError('Please wait while we check your username.');
      return false;
    }
    if (usernameStatus !== 'available') {
      setError('Please choose a valid username.');
      return false;
    }
    if (!username.trim()) {
      setError('Username is required.');
      return false;
    }
    if (!dob) {
      setError('Date of birth is required.');
      return false;
    }
    if (!address.trim()) {
      setError('Address is required.');
      return false;
    }
    return true;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      if (!identifier.trim()) {
        setError('Please enter your username or email.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }
      
      setLoading(true);
      const res = await login(identifier.trim(), password);
      
      if (!res.success) {
        setError(res.error);
        setLoading(false);
        return;
      }
      
      setLoading(false);
      return;
    }

    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    
    try {
      const res = await register(
        username.trim(),
        email.trim(),
        password,
        displayName.trim()
      );
      
      if (!res.success) {
        setError(res.error);
        setLoading(false);
        return;
      }

      console.log('Registration successful!');
      setLoading(false);
      
      setIsLogin(true);
      setStep(1);
      setError('✅ Account created successfully! Please login with your credentials.');
      setIdentifier(username);
      
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
          Your Name
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
            <User className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            name="name"
            autoComplete="name"
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

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
            <Mail className="w-4.5 h-4.5" />
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. sarah@example.com"
            className="w-full input-field input-with-icon text-[14px]"
          />
        </div>
        <p className="text-[10px] text-primary-olive/80 mt-1">
          Used to log in and to recover your account.
        </p>
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
            type={showPassword ? 'text' : 'password'}
            name="new-password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full input-field input-with-icon text-[14px] pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-primary-olive hover:text-primary-wine transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>

        {password && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-primary-olive/20 overflow-hidden flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all ${
                    getPasswordStrength(password).score >= i
                      ? getPasswordStrength(password).score === 1
                        ? 'bg-red-500'
                        : getPasswordStrength(password).score === 2
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-primary-olive/20'
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-[10px] font-semibold mt-1 ${
                getPasswordStrength(password).score === 1
                  ? 'text-red-500'
                  : getPasswordStrength(password).score === 2
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}
            >
              {getPasswordStrength(password).label} password
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
            <Lock className="w-4.5 h-4.5" />
          </span>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirm-password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full input-field input-with-icon text-[14px] pr-11 ${
              confirmPassword && confirmPassword !== password ? 'border-red-400 focus:border-red-500' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-primary-olive hover:text-primary-wine transition-colors cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
        {confirmPassword && confirmPassword !== password && (
          <p className="text-[10px] text-red-500 font-semibold mt-1">Passwords do not match.</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleNextStep}
        className="w-full btn-primary py-3 mt-2 group flex items-center justify-center gap-2"
      >
        Continue
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </>
  );

  const renderStep2 = () => (
    <>
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
          Choose a Username (Unique)
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
            <UserCheck className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. sarah_codes"
            className={`w-full input-field input-with-icon text-[14px] ${
              usernameStatus === 'taken' ? 'border-red-400 focus:border-red-500' : ''
            } ${usernameStatus === 'available' ? 'border-green-400' : ''}`}
          />
          {usernameStatus === 'available' && (
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-green-600 pointer-events-none">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </span>
          )}
          {usernameStatus === 'taken' && (
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-red-500 pointer-events-none">
              <AlertCircle className="w-4.5 h-4.5" />
            </span>
          )}
        </div>

        {usernameStatus === 'checking' && (
          <p className="text-[10px] text-slate-400 mt-1">Checking availability...</p>
        )}

        {usernameStatus === 'available' && (
          <p className="text-[10px] text-green-600 font-semibold mt-1">
            @{username.trim()} is available.
          </p>
        )}

        {usernameStatus === 'taken' && (
          <div className="mt-1.5">
            <p className="text-[10px] text-primary-wine font-semibold">
              @{username.trim()} is already taken. Try one of these instead:
            </p>
            {usernameSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {usernameSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUsername(s)}
                    className="text-[11px] font-bold text-primary-dark bg-white border border-primary-olive/40 px-2.5 py-1 rounded-lg hover:border-primary-wine hover:text-primary-wine hover:bg-primary-wine/5 transition-all cursor-pointer"
                  >
                    @{s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {usernameStatus === null && username && (
          <p className="text-[10px] text-primary-olive/80 mt-1">
            Only letters, numbers, and underscores.
          </p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
          Date of Birth
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
            <Calendar className="w-4.5 h-4.5" />
          </span>
          <input
            type="date"
            name="dob"
            autoComplete="bday"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full input-field input-with-icon text-[14px]"
          />
        </div>
        <p className="text-[10px] text-primary-olive/80 mt-1">
          We use this to personalize your experience.
        </p>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
          Address
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
            <MapPin className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            name="address"
            autoComplete="street-address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, City, Country"
            className="w-full input-field input-with-icon text-[14px]"
          />
        </div>
        <p className="text-[10px] text-primary-olive/80 mt-1">
          Your location helps us connect you with local communities.
        </p>
      </div>

      {/* FIXED: Create Account Button - Always visible and prominent */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-primary-olive/20">
        <button
          type="button"
          onClick={handlePrevStep}
          className="flex-1 bg-primary-light hover:bg-primary-olive/20 text-primary-dark font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-primary-olive/30"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={loading || usernameStatus === 'checking' || usernameStatus === 'taken'}
          className={`flex-[2] py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-white ${
            loading || usernameStatus === 'checking' || usernameStatus === 'taken'
              ? 'bg-primary-olive/30 cursor-not-allowed' 
              : 'bg-primary-wine hover:bg-primary-wine/90 shadow-md hover:shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Creating...
            </>
          ) : (
            <>
              Create Account
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-primary-wine' : 'w-4 bg-primary-olive/30'}`} />
      <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-primary-wine' : 'w-4 bg-primary-olive/30'}`} />
    </div>
  );

  return (
    <div className="min-h-screen flex bg-page">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-primary-light border-r border-primary-olive/30">
        <div className="absolute inset-0 z-0 bg-primary-wine">
          <img 
            src={loginImg} 
            alt="Connecta Hero" 
            className="w-full h-full object-cover opacity-80" 
          />
          <div className="absolute inset-0 bg-black/35 z-0"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-start bg-primary-wine/80 backdrop-blur-md py-2 px-4 rounded-xl border border-white/20 shadow-md">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center border border-white/10">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-white text-md font-bold tracking-tight">Connecta</span>
        </div>

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
                onClick={() => { 
                  setIsLogin(true); 
                  setError('');
                  setStep(1);
                  setUsernameStatus(null);
                  setUsernameSuggestions([]);
                }}
                className={`flex-1 py-2.5 text-center font-bold text-[13px] rounded-lg transition-all cursor-pointer ${
                  isLogin ? 'bg-primary-wine text-white shadow-sm' : 'text-primary-dark/70 hover:text-primary-wine'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { 
                  setIsLogin(false); 
                  setError('');
                  setStep(1);
                }}
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
              {isLogin 
                ? 'Sign in with your username or email.' 
                : `Step ${step} of 2: ${step === 1 ? 'Account details' : 'Profile details'}`
              }
            </p>

            {error && (
              <div className={`mb-4 p-3.5 rounded-xl border text-[13px] font-semibold ${
                error.includes('successfully') 
                  ? 'bg-green-50 border-green-300 text-green-700' 
                  : 'bg-primary-wine/10 border-primary-wine/30 text-primary-wine'
              }`}>
                {error}
              </div>
            )}

            {!isLogin && renderStepIndicator()}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isLogin ? (
                // Login form
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-wine mb-1.5">
                      Username or Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary-olive pointer-events-none z-10">
                        <UserCheck className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="text"
                        name="identifier"
                        autoComplete="username"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="sarah_codes or sarah@example.com"
                        className="w-full input-field input-with-icon text-[14px]"
                      />
                    </div>
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
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full input-field input-with-icon text-[14px] pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-primary-olive hover:text-primary-wine transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 mt-2 group flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                // Registration form
                step === 1 ? renderStep1() : renderStep2()
              )}
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
                      type="button"
                      onClick={() => { setIdentifier(u); setError(''); }}
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