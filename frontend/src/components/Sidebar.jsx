import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Compass, User, LogOut, MessageSquareCode, PenSquare } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'Profile', path: `/profile/${user?.username}`, icon: User },
  ];

  return (
    <aside className="w-16 md:w-64 border-r border-primary-olive/30 h-screen sticky top-0 flex flex-col justify-between py-5 px-3 md:px-4 shrink-0 bg-white z-20 shadow-sm">
      <div className="flex flex-col gap-7">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-3 px-2 select-none">
          <div className="w-9 h-9 rounded-xl bg-primary-wine flex items-center justify-center shadow-md shadow-primary-wine/25 shrink-0">
            <MessageSquareCode className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="hidden md:block text-[17px] font-bold tracking-tight text-primary-dark">
            Connecta
          </span>
        </NavLink>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary-wine text-white shadow-md'
                      : 'text-primary-olive hover:text-primary-wine hover:bg-primary-light/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-primary-olive'}`} />
                    <span className="hidden md:block">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* New Post button (shown only md+) */}
        <NavLink
          to="/"
          className="hidden md:flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold btn-primary select-none justify-center"
        >
          <PenSquare className="w-4 h-4" />
          <span>New Post</span>
        </NavLink>
      </div>

      {/* User Profile Card at bottom */}
      <div className="flex flex-col gap-2">
        {user && (
          <NavLink
            to={`/profile/${user.username}`}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary-light/60 transition-colors text-left border border-transparent hover:border-primary-olive/30"
          >
            <div className="relative shrink-0">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.displayName}
                className="w-9 h-9 rounded-xl bg-slate-100 object-cover border-2 border-primary-olive/40"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-[13px] font-bold text-primary-dark truncate leading-tight">{user.displayName}</p>
              <p className="text-[11px] text-primary-olive truncate mt-0.5">@{user.username}</p>
            </div>
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-primary-wine hover:bg-primary-wine/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden md:block">Logout</span>
        </button>
      </div>
    </aside>
  );
}
