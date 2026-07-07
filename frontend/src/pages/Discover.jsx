import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Compass, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Discover() {
  const { user: currentUser, updateUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users/discover');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleFollow = async (targetId) => {
    try {
      const res = await axios.post(`/api/users/follow/${targetId}`);
      updateUser({ ...currentUser, following: res.data.currentUserFollowing });
      setUsers((prev) => prev.filter((u) => u._id !== targetId));
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 md:p-6 text-left">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary-wine" />
          Discover People
        </h1>
        <p className="text-[12px] text-slate-500 mt-0.5">Find and follow people to fill your feed.</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
          <Search className="w-4.5 h-4.5" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or username..."
          className="w-full input-field py-3 pl-10 pr-4 text-[14px] shadow-sm"
        />
      </div>

      {/* Users */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-slate-200 p-4 rounded-2xl flex gap-3 animate-pulse shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
                <div className="h-2.5 bg-slate-100 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-slate-300 rounded-2xl bg-white">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-500">No users found</p>
          <p className="text-[12px] text-slate-400 mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div key={item._id} className="app-card app-card-hover p-4 flex justify-between items-start gap-3">
              <div className="flex gap-3 overflow-hidden">
                <Link to={`/profile/${item.username}`} className="shrink-0">
                  <img
                    src={item.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`}
                    alt={item.displayName}
                    className="w-12 h-12 rounded-xl bg-primary-light object-cover border border-primary-olive hover:border-primary-wine transition-colors"
                  />
                </Link>
                <div className="overflow-hidden">
                  <Link to={`/profile/${item.username}`} className="font-bold text-[13px] text-primary-dark hover:text-primary-wine transition-colors block truncate">
                    {item.displayName}
                  </Link>
                  <p className="text-[11px] text-slate-400 font-semibold">@{item.username}</p>
                  <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.bio || 'Active member of the community.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleFollow(item._id)}
                className="flex items-center gap-1 text-[12px] font-bold text-primary-wine bg-primary-wine/5 hover:bg-primary-wine/10 border border-primary-wine/20 px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Follow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
