import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Bell, UserPlus, Check, X, CheckCircle2 } from 'lucide-react';

export default function Notifications() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, notifRes] = await Promise.all([
        axios.get('/api/users/follow-requests'),
        axios.get('/api/notifications')
      ]);
      setRequests(reqRes.data);
      // Follow requests already have their own dedicated section above,
      // so keep the general feed to the rest (e.g. follow_accept).
      setNotifications(notifRes.data.filter((n) => n.type !== 'follow_request'));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    axios.put('/api/notifications/read-all').catch((err) => console.error('Error marking read:', err));
  }, []);

  const respond = async (requesterId, action) => {
    setRespondingId(requesterId);
    try {
      await axios.post(`/api/users/follow-requests/${requesterId}/respond`, { action });
      setRequests((prev) => prev.filter((r) => r.requester._id !== requesterId));
    } catch (err) {
      console.error('Error responding to follow request:', err);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 md:p-6 text-left">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-wine" />
          Notifications
        </h1>
        <p className="text-[12px] text-slate-500 mt-0.5">Follow requests and updates.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-200 p-4 rounded-2xl flex gap-3 animate-pulse shadow-sm">
              <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Pending follow requests needing approval */}
          {requests.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold text-[12px] uppercase tracking-wider text-slate-500 mb-3">
                Follow Requests ({requests.length})
              </h2>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req._id} className="app-card p-4 flex items-center justify-between gap-3">
                    <Link to={`/profile/${req.requester.username}`} className="flex items-center gap-3 overflow-hidden group">
                      <img
                        src={req.requester.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester.username}`}
                        alt={req.requester.displayName}
                        className="w-11 h-11 rounded-xl bg-primary-light object-cover border border-primary-olive group-hover:border-primary-wine transition-colors shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="font-bold text-[13px] text-primary-dark truncate group-hover:text-primary-wine transition-colors">
                          {req.requester.displayName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          @{req.requester.username} wants to follow you
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => respond(req.requester._id, 'accept')}
                        disabled={respondingId === req.requester._id}
                        className="flex items-center gap-1 text-[12px] font-bold text-white bg-primary-wine hover:bg-primary-dark px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => respond(req.requester._id, 'reject')}
                        disabled={respondingId === req.requester._id}
                        className="flex items-center gap-1 text-[12px] font-bold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other notifications (e.g. someone accepted your follow request) */}
          <h2 className="font-bold text-[12px] uppercase tracking-wider text-slate-500 mb-3">Recent Activity</h2>
          {notifications.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-slate-300 rounded-2xl bg-white">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-slate-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n._id} className="app-card p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-wine/10 flex items-center justify-center shrink-0">
                    {n.type === 'follow_accept' ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-primary-wine" />
                    ) : (
                      <UserPlus className="w-4.5 h-4.5 text-primary-wine" />
                    )}
                  </div>
                  <p className="text-[13px] text-slate-700">
                    <Link to={`/profile/${n.senderId?.username}`} className="font-bold text-primary-dark hover:text-primary-wine">
                      {n.senderId?.displayName}
                    </Link>{' '}
                    {n.type === 'follow_accept' ? 'approved your follow request.' : 'followed you.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}