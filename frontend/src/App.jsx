import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import Notifications from './pages/Notifications'; 
import Sidebar from './components/Sidebar';
// adjust path to match your folder
import { Loader2 } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-slate-600 text-xs font-bold tracking-wide uppercase">Connecta is loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-100 text-slate-800 flex justify-center">
        {/* Main layout container */}
        <div className="w-full max-w-7xl flex relative min-h-screen">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Center Main Content */}
          <main className="flex-1 border-r border-slate-200 min-h-screen pb-10 bg-slate-100/40">
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
