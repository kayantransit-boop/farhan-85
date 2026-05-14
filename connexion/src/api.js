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

export const login            = (email, password)       => req('POST', '/auth/login',                 { email, password });
export const register         = (email, password, name) => req('POST', '/auth/register',              { email, password, name });
export const getMe            = ()                      => req('GET',  '/auth/me');
export const getProfiles      = ()                      => req('GET',  '/profiles');
export const swipe            = (profileId, action)     => req('POST', '/profiles/swipe',             { profileId, action });
export const getMatches       = ()                      => req('GET',  '/matches');
export const getMessages      = (profileId)             => req('GET',  `/messages/${profileId}`);
export const sendMessage      = (profileId, text)       => req('POST', `/messages/${profileId}`,      { text });
export const updateProfile    = (data)                  => req('PUT',  '/profile',                    data);
export const discoverUsers    = ()                      => req('GET',  '/users/discover');
export const swipeUser        = (targetId, action)      => req('POST', `/users/swipe/${targetId}`,    { action });
export const getUserMatches   = ()                      => req('GET',  '/users/matches');
export const getUserMessages  = (matchUserId)           => req('GET',  `/users/messages/${matchUserId}`);
export const sendUserMessage  = (matchUserId, text)     => req('POST', `/users/messages/${matchUserId}`, { text });
