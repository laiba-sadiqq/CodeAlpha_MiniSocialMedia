import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { Edit3, UserPlus, UserMinus, Clock, Calendar, Grid, X, Upload, Check } from 'lucide-react';

// Preset avatars using dicebear with various nice seeds
const PRESET_AVATARS = [
  { label: 'Adventurer', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preset1' },
  { label: 'Creative', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preset2' },
  { label: 'Explorer', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preset3' },
  { label: 'Builder', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preset4' },
  { label: 'Coder', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preset5' },
  { label: 'Designer', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preset6' },
  { label: 'Leader', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preset7' },
  { label: 'Maker', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preset8' },
];

// Quick-pick status/mood presets
const STATUS_PRESETS = [
  '🌙 Feeling sleepy',
  '🎮 Gaming',
  '🎵 Listening to music',
  '📚 Studying',
  '💻 Coding',
];

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarTab, setAvatarTab] = useState('preset'); // 'preset' | 'upload' | 'url'
  const [modalError, setModalError] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const fileInputRef = useRef(null);

  const isOwnProfile = currentUser?.username === username?.toLowerCase();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/users/profile/${username}`);
      setProfileUser(res.data.user);
      setPosts(res.data.posts);
      setFollowersCount(res.data.user.followers?.length || 0);
      if (currentUser && res.data.user.followers) {
        setIsFollowing(res.data.user.followers.includes(currentUser._id));
      }
      setHasPendingRequest(!!res.data.hasPendingRequest);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [username, currentUser]);

  const handleFollowToggle = async () => {
    if (isOwnProfile) return;
    try {
      const res = await axios.post(`/api/users/follow/${profileUser._id}`);
      // status is one of: 'not_following' (unfollowed or request withdrawn)
      // or 'requested' (a new follow request was just sent, pending approval)
      setIsFollowing(res.data.status === 'following');
      setHasPendingRequest(res.data.status === 'requested');
      setFollowersCount(res.data.followersCount);
      updateUser({ ...currentUser, following: res.data.currentUserFollowing });
    } catch (err) {
      console.error('Error following/unfollowing:', err);
    }
  };

  const openEditModal = () => {
    setEditDisplayName(profileUser.displayName || '');
    setEditBio(profileUser.bio || '');
    setEditStatus(profileUser.status || '');
    setEditAvatarUrl(profileUser.avatarUrl || '');
    setAvatarTab('preset');
    setModalError('');
    setShowEditModal(true);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatarUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editDisplayName.trim()) { setModalError('Display name is required.'); return; }
    setModalSaving(true);
    try {
      const res = await axios.put('/api/users/profile', {
        displayName: editDisplayName,
        bio: editBio,
        status: editStatus,
        avatarUrl: editAvatarUrl
      });
      updateUser(res.data);
      setProfileUser((prev) => ({ ...prev, displayName: res.data.displayName, bio: res.data.bio, status: res.data.status, avatarUrl: res.data.avatarUrl }));
      setShowEditModal(false);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-pulse">
      <div className="h-36 bg-slate-200 rounded-2xl"></div>
      <div className="flex gap-3 items-end -mt-8 px-4">
        <div className="w-20 h-20 bg-slate-300 rounded-2xl border-4 border-slate-100 shrink-0"></div>
        <div className="flex-1 space-y-2 pb-1">
          <div className="h-4 bg-slate-300 rounded w-1/3"></div>
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  if (!profileUser) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="text-lg font-bold text-slate-800 mb-2">User not found</h2>
      <Link to="/" className="text-[13px] font-bold text-primary-wine hover:text-primary-dark">← Go Home</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 md:p-6 text-left">
      {/* Profile Row */}
      <div className="px-2 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-slate-200 mt-4">
        <div className="flex items-end gap-3">
          <img
            src={profileUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
            alt={profileUser.displayName}
            className="w-20 h-20 rounded-2xl bg-white object-cover border border-primary-olive shadow-sm shrink-0"
          />
          <div className="pb-1">
            <h1 className="text-[19px] font-extrabold text-slate-900 leading-tight">{profileUser.displayName}</h1>
            <p className="text-[12px] text-slate-400 font-semibold mt-0.5">@{profileUser.username}</p>
            {profileUser.status && (
              <span className="inline-flex items-center mt-1.5 text-[12px] font-semibold text-primary-wine bg-primary-wine/10 border border-primary-wine/20 rounded-full px-2.5 py-1">
                {profileUser.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 pb-1">
          {isOwnProfile ? (
            <button
              onClick={openEditModal}
              className="bg-white border-2 border-primary-olive hover:border-primary-wine hover:bg-primary-wine/5 text-primary-dark hover:text-primary-wine font-bold text-[13px] py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : isFollowing ? (
            <button
              onClick={handleFollowToggle}
              className="font-bold text-[13px] py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm bg-slate-100 border-2 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <UserMinus className="w-4 h-4" />Unfollow
            </button>
          ) : hasPendingRequest ? (
            <button
              onClick={handleFollowToggle}
              title="Click to cancel your request"
              className="font-bold text-[13px] py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm bg-slate-100 border-2 border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <Clock className="w-4 h-4" />Requested
            </button>
          ) : (
            <button
              onClick={handleFollowToggle}
              className="btn-primary py-2 px-4 border-2 border-primary-dark shadow-sm font-bold text-[13px] rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />Follow
            </button>
          )}
        </div>
      </div>

      {/* Bio & Stats */}
      <div className="py-5 px-2 space-y-4">
        {profileUser.bio
          ? <p className="text-[14px] text-slate-600 leading-relaxed">{profileUser.bio}</p>
          : <p className="text-[13px] text-slate-400 italic">No bio written yet.</p>
        }

        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-semibold">
          <Calendar className="w-4 h-4 text-slate-400" />
          Joined {new Date(profileUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="text-center py-3 rounded-xl bg-primary-light/60 border border-primary-olive/20">
            <p className="text-[18px] font-extrabold text-slate-900 leading-none">{posts.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Posts</p>
          </div>
          <div className="text-center py-3 rounded-xl bg-primary-light/60 border border-primary-olive/20">
            <p className="text-[18px] font-extrabold text-slate-900 leading-none">{followersCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Followers</p>
          </div>
          <div className="text-center py-3 rounded-xl bg-primary-light/60 border border-primary-olive/20">
            <p className="text-[18px] font-extrabold text-slate-900 leading-none">{profileUser.following?.length || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Following</p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="px-2">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
          <Grid className="w-4 h-4 text-slate-400" />
          <h2 className="font-bold text-[12px] uppercase tracking-wider text-slate-500">Posts ({posts.length})</h2>
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-slate-300 rounded-2xl bg-white">
            <p className="text-[38px] leading-none mb-3">📸</p>
            <p className="text-[14px] font-bold text-slate-600">Nothing here yet.</p>
            {isOwnProfile ? (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 mt-4 btn-primary py-2 px-4 text-[13px]"
              >
                Create your first post!
              </Link>
            ) : (
              <p className="text-[12px] text-slate-400 mt-1.5">This user hasn't posted anything yet.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
            ))}
          </div>
        )}
      </div>

      {/* ─── EDIT PROFILE MODAL ─── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="app-card w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-[16px] text-slate-900">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[80vh] overflow-y-auto space-y-5">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold">{modalError}</div>
              )}

              {/* Avatar Picker Section */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Profile Picture</label>

                {/* Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={editAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
                    alt="Avatar Preview"
                    className="w-16 h-16 rounded-2xl bg-slate-100 object-cover border-2 border-slate-200 shadow-sm"
                  />
                  <div>
                    <p className="text-[13px] font-bold text-slate-700 mb-0.5">Current Avatar</p>
                    <p className="text-[11px] text-slate-400">Choose a preset or upload your own</p>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-xl bg-primary-light/70 p-1 gap-0.5 mb-4 border border-primary-olive/20">
                  {[{ key: 'preset', label: '🎭 Presets' }, { key: 'upload', label: '📷 Upload Photo' }, { key: 'url', label: '🔗 Image URL' }].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAvatarTab(tab.key)}
                        className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                          avatarTab === tab.key ? 'bg-primary-wine text-white shadow-sm' : 'text-primary-dark/80 hover:text-primary-wine'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Preset Grid */}
                {avatarTab === 'preset' && (
                  <div className="grid grid-cols-4 gap-2.5">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setEditAvatarUrl(preset.url)}
                        className={`relative flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all ${
                          editAvatarUrl === preset.url
                            ? 'border-primary-wine bg-primary-wine/5 shadow-sm shadow-primary-wine/10'
                            : 'border-primary-olive/40 hover:border-primary-wine hover:bg-primary-light/50'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-12 h-12 rounded-lg bg-slate-100" />
                        {editAvatarUrl === preset.url && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-wine rounded-full flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* File Upload */}
                {avatarTab === 'upload' && (
                  <div>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="w-full flex flex-col items-center gap-2 py-7 border-2 border-dashed border-primary-olive rounded-xl cursor-pointer hover:border-primary-wine hover:bg-primary-wine/5 transition-all"
                    >
                      <Upload className="w-7 h-7 text-slate-400" />
                      <p className="text-[13px] font-semibold text-slate-600">Click to open file explorer</p>
                      <p className="text-[11px] text-slate-400">JPG, PNG, GIF up to 5MB</p>
                    </button>
                    {editAvatarUrl?.startsWith('data:image') && (
                      <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl">
                        <img src={editAvatarUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="text-[12px] font-bold text-green-700">Photo uploaded!</p>
                          <p className="text-[10px] text-green-600">Your new profile picture is ready</p>
                        </div>
                        <Check className="w-4 h-4 text-green-600 ml-auto" />
                      </div>
                    )}
                  </div>
                )}

                {/* URL Input */}
                {avatarTab === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={editAvatarUrl?.startsWith('data:') ? '' : editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="w-full input-field py-2.5 px-4 text-[14px]"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">Paste any direct link to an image file.</p>
                  </div>
                )}
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Display Name</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full input-field py-2.5 px-4 text-[14px]"
                />
              </div>

              {/* Status / Mood */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Status / Mood</label>
                <input
                  type="text"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value.slice(0, 60))}
                  placeholder="e.g. 🎮 Gaming"
                  maxLength={60}
                  className="w-full input-field py-2.5 px-4 text-[14px]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {STATUS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditStatus(preset)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                        editStatus === preset
                          ? 'bg-primary-wine text-white border-primary-wine'
                          : 'bg-white text-primary-dark border-primary-olive/40 hover:border-primary-wine hover:text-primary-wine'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  {editStatus && (
                    <button
                      type="button"
                      onClick={() => setEditStatus('')}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell your community about yourself..."
                  rows="3"
                  className="w-full input-field py-2.5 px-4 text-[14px] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[13px] py-2 px-4 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={modalSaving}
                className="btn-primary py-2 px-5 disabled:opacity-60"
              >
                {modalSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}