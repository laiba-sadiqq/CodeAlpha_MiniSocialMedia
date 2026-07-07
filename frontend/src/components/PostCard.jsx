import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id) || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = async () => {
    if (likeAnimating) return;
    setLikeAnimating(true);
    try {
      const res = await axios.post(`/api/posts/like/${post._id}`);
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error('Error liking post:', err);
    } finally {
      setTimeout(() => setLikeAnimating(false), 200);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await axios.get(`/api/comments/${post._id}`);
      setComments(res.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      fetchComments();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      const res = await axios.post(`/api/comments/${post._id}`, { content: commentContent });
      setComments((prev) => [...prev, res.data]);
      setCommentContent('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const isPostAuthor = post.userId?._id === user?._id;

  return (
    <article className="app-card app-card-hover transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start p-4 md:p-5 pb-0">
        <Link to={`/profile/${post.userId?.username}`} className="flex items-center gap-3 group">
          <div className="relative shrink-0">
            <img
              src={post.userId?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId?.username}`}
              alt={post.userId?.displayName}
              className="w-11 h-11 rounded-xl bg-primary-light object-cover border-primary group-hover:border-primary transition-colors"
            />
          </div>
          <div>
            <h3 className="font-bold text-[14px] text-primary-dark group-hover:text-primary-wine transition-colors leading-snug">
              {post.userId?.displayName}
            </h3>
            <p className="text-[12px] text-slate-400 mt-0.5">@{post.userId?.username} · {timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {isPostAuthor && (
          <button
            onClick={() => onDelete(post._id)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete Post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 md:px-5 py-3.5 space-y-3.5">
        <p className="text-[14.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {post.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-100 max-h-[380px] bg-slate-50">
            <img
              src={post.imageUrl}
              alt="Post attachment"
              className="w-full h-full object-cover max-h-[380px]"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-1 px-4 md:px-5 py-3 border-t border-slate-100">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold select-none cursor-pointer transition-all ${
            isLiked
              ? 'text-red-600 bg-red-50'
              : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
          }`}
        >
          <Heart className={`w-4.5 h-4.5 transition-transform ${isLiked ? 'fill-red-600 scale-110' : ''} ${likeAnimating ? 'scale-125' : ''}`} />
          <span>{likesCount}</span>
        </button>

        {/* Comments Toggle */}
        <button
          onClick={toggleComments}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all ${
            showComments
              ? 'text-primary-wine bg-primary-wine/10'
              : 'text-slate-500 hover:text-primary-wine hover:bg-primary-wine/10'
          }`}
        >
          <MessageSquare className="w-4.5 h-4.5" />
          <span>{showComments ? 'Hide' : 'Comments'}</span>
          {showComments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-slate-100 px-4 md:px-5 py-4 space-y-3 bg-slate-50/60 rounded-b-2xl">
          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2.5">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              alt=""
              className="w-8 h-8 rounded-lg bg-slate-100 object-cover border border-slate-200 shrink-0 mt-0.5"
            />
            <div className="flex-1 flex items-center gap-2 bg-white border border-primary-olive rounded-xl px-3 shadow-sm focus-within:border-primary-wine focus-within:ring-2 focus-within:ring-primary-wine/20 transition-all">
              <input
                type="text"
                required
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent py-2 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              <button type="submit" className="text-primary-wine hover:text-primary-dark cursor-pointer transition-colors shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <p className="text-xs text-slate-400 text-center py-2">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {comments.map((comment) => {
                const isCommentOwner = comment.userId?._id === user?._id;
                const canDelete = isCommentOwner || isPostAuthor;
                return (
                  <div key={comment._id} className="flex gap-2.5 group/comment">
                    <Link to={`/profile/${comment.userId?.username}`} className="shrink-0">
                      <img
                        src={comment.userId?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId?.username}`}
                        alt=""
                        className="w-7.5 h-7.5 rounded-lg bg-slate-100 object-cover border border-slate-200"
                      />
                    </Link>
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 relative shadow-sm">
                      <div className="flex justify-between items-start mb-0.5">
                        <Link to={`/profile/${comment.userId?.username}`} className="font-bold text-[12px] text-primary-dark hover:text-primary-wine transition-colors">
                          {comment.userId?.displayName}
                        </Link>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[13px] text-slate-600 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
