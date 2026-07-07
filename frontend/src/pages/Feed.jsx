import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { Send, UserPlus, X, UploadCloud, Image, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const fileInputRef = useRef(null);

  const fetchFeed = async () => {
    try {
      const res = await axios.get('/api/posts/feed');
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get('/api/users/discover');
      setSuggestions(res.data.slice(0, 4));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchSuggestions();
    setFollowingIds(user?.following || []);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImagePreview = () => {
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post('/api/posts', { content, imageUrl: imagePreview });
      setPosts((prev) => [res.data, ...prev]);
      setContent('');
      setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleFollowUser = async (targetId) => {
    try {
      await axios.post(`/api/users/follow/${targetId}`);
      setSuggestions((prev) => prev.filter((u) => u._id !== targetId));
      fetchFeed();
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Main Feed */}
      <div className="flex-1 px-4 py-5 md:p-6 lg:border-r lg:border-slate-200 max-w-2xl mx-auto w-full">

        {/* Page Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-sans">Home Feed</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">What's happening in your network</p>
          </div>
          <Sparkles className="w-5 h-5 text-primary-wine" />
        </div>

        {/* Create Post Card */}
        <div className="app-card p-4 md:p-5 mb-5">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <div className="flex gap-3">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                alt={user?.displayName}
                className="w-10 h-10 rounded-xl bg-primary-light object-cover border border-primary-olive shrink-0"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Share something, ${user?.displayName?.split(' ')[0]}...`}
                required
                rows="3"
                className="w-full bg-transparent border-0 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-[14px] resize-none py-1"
              />
            </div>

            {/* Hidden File Input */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-[300px] bg-slate-50">
                <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-[300px]" />
                <button
                  type="button"
                  onClick={clearImagePreview}
                  className="absolute top-2.5 right-2.5 p-1 rounded-full bg-slate-900/70 text-white cursor-pointer hover:bg-slate-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-olive hover:text-primary-wine hover:bg-primary-wine/10 px-3 py-2 rounded-lg border border-primary-olive transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Photo</span>
              </button>

              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-[13px] px-5 py-2 active:scale-95 select-none"
              >
                <span>{submitting ? 'Posting...' : 'Post'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0"></div>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-2.5 bg-slate-100 rounded w-1/5"></div>
                  </div>
                </div>
                <div className="h-3.5 bg-slate-100 rounded w-full"></div>
                <div className="h-3.5 bg-slate-100 rounded w-4/5"></div>
                <div className="h-44 bg-slate-100 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-slate-300 rounded-2xl bg-white">
            <Image className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-600">Your feed is empty</h3>
            <p className="text-[12px] text-slate-400 mt-1.5 max-w-xs mx-auto">
              Follow people from the Discover tab or write your first post above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-80 p-5 shrink-0">
        <div className="sticky top-5 space-y-4">

          {/* Profile Card */}
          <div className="app-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                alt={user?.displayName}
                className="w-12 h-12 rounded-xl bg-white object-cover border border-primary-olive shadow-sm shrink-0"
              />
              <div className="overflow-hidden">
                <h4 className="font-bold text-[14px] text-slate-900 leading-tight truncate">{user?.displayName}</h4>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">@{user?.username}</p>
              </div>
            </div>
            {user?.bio && <p className="text-[12px] text-slate-600 mt-2 leading-relaxed">{user.bio}</p>}
            <div className="flex gap-5 mt-3 pt-3 border-t border-slate-100">
              <div className="text-center">
                <p className="text-[16px] font-bold text-slate-800">{user?.followers?.length || 0}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-bold text-slate-800">{user?.following?.length || 0}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Following</p>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="app-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[12px] uppercase tracking-wider text-slate-500">Who to follow</h3>
                <Link to="/discover" className="text-[12px] font-bold text-primary-wine hover:text-primary-dark">See all</Link>
              </div>
              <div className="space-y-3">
                {suggestions.map((sug) => (
                  <div key={sug._id} className="flex items-center justify-between gap-2">
                    <Link to={`/profile/${sug.username}`} className="flex items-center gap-2.5 overflow-hidden group">
                      <img
                        src={sug.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sug.username}`}
                        alt={sug.displayName}
                        className="w-8 h-8 rounded-lg bg-primary-light object-cover border border-primary-olive group-hover:border-primary-wine transition-colors shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="font-bold text-[12px] text-primary-dark truncate group-hover:text-primary-wine transition-colors">{sug.displayName}</p>
                        <p className="text-[10px] text-slate-400 truncate">@{sug.username}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleFollowUser(sug._id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary-wine bg-primary-wine/5 hover:bg-primary-wine/10 border border-primary-wine/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3 h-3" />
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-400 px-1 font-medium">&copy; 2026 Connecta. All rights reserved.</p>
        </div>
      </aside>
    </div>
  );
}
