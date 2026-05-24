const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function headers() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Retry once on network failure (handles Render cold start ~30s delay)
async function req(method, path, body, retry = true) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: headers(),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur serveur');
    return data;
  } catch (err) {
    if (retry && err.message === 'Failed to fetch') {
      // Server waking up (Render free tier) — wait 4s then retry once
      await new Promise(r => setTimeout(r, 4000));
      return req(method, path, body, false);
    }
    throw err;
  }
}

// Call on app start to wake up the Render server before user action
export const ping = () => fetch(`${BASE}/ping`).catch(() => {});

export const login             = (email, password)            => req('POST',   '/auth/login',                        { email, password });
export const register          = (email, password, name, photo) => req('POST', '/auth/register',                    { email, password, name, photo });
export const getMe             = ()                           => req('GET',    '/auth/me');
export const forgotPassword    = (email)                      => req('POST',   '/auth/forgot-password',              { email });
export const resetPassword     = (token, password)            => req('POST',   '/auth/reset-password',               { token, password });

export const updateProfile     = (data)                       => req('PUT',    '/profile',                           data);
export const discoverUsers     = (filters = {})               => req('GET',    `/users/discover${toQuery(filters)}`);
export const swipeUser         = (targetId, action)           => req('POST',   `/users/swipe/${targetId}`,           { action });
export const getSwipeRemaining = ()                           => req('GET',    '/users/swipe-remaining');
export const getUserMatches    = ()                           => req('GET',    '/users/matches');
export const getUserMessages   = (matchUserId)                => req('GET',    `/users/messages/${matchUserId}`);
export const sendUserMessage   = (matchUserId, text)          => req('POST',   `/users/messages/${matchUserId}`,     { text });
export const markRead          = (matchUserId)                => req('POST',   `/users/messages/${matchUserId}/read`);
export const heartbeat         = ()                           => req('POST',   '/users/heartbeat');
export const getOnlineUsers    = ()                           => req('GET',    '/users/online');
export const getUserStatus     = (userId)                     => req('GET',    `/users/status/${userId}`);
export const reportUser        = (userId, reason)             => req('POST',   `/users/report/${userId}`,            { reason });
export const blockUser         = (userId)                     => req('POST',   `/users/block/${userId}`);
export const unblockUser       = (userId)                     => req('DELETE', `/users/block/${userId}`);
export const getBlocked        = ()                           => req('GET',    '/users/blocked');

function toQuery(obj) {
  const p = Object.entries(obj).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return p.length ? '?' + p.join('&') : '';
}
