const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function headers() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

export const login             = (email, password)            => req('POST',   '/auth/login',                        { email, password });
export const register          = (email, password, name, photo) => req('POST', '/auth/register',                    { email, password, name, photo });
export const getMe             = ()                           => req('GET',    '/auth/me');
export const forgotPassword    = (email)                      => req('POST',   '/auth/forgot-password',              { email });
export const resetPassword     = (token, password)            => req('POST',   '/auth/reset-password',               { token, password });

export const getProfiles       = ()                           => req('GET',    '/profiles');
export const swipe             = (profileId, action)          => req('POST',   '/profiles/swipe',                    { profileId, action });
export const getMatches        = ()                           => req('GET',    '/matches');
export const getMessages       = (profileId)                  => req('GET',    `/messages/${profileId}`);
export const sendMessage       = (profileId, text)            => req('POST',   `/messages/${profileId}`,             { text });

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
