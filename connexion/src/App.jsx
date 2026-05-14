import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, X, Star, MessageCircle, User, Shield,
  ChevronLeft, Send, MapPin, Edit3, Check, Eye, EyeOff, LogOut
} from 'lucide-react';
import * as api from './api';
import AdminPanel from './Admin';

const G = 'bg-gradient-to-r from-[#0089CF] to-[#12AD2B]';

function Avatar({ photo, initials, color, size = 14, online = false }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size * 4, height: size * 4 }}>
      {photo
        ? <img src={photo} alt={initials} className="w-full h-full rounded-full object-cover" />
        : <div className={`w-full h-full rounded-full bg-gradient-to-br ${color || 'from-pink-400 to-purple-500'} flex items-center justify-center font-bold text-white`}
            style={{ fontSize: size * 1.1 }}>{initials}</div>
      }
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
      )}
    </div>
  );
}

function Logo({ size = 'md' }) {
  const sizes = {
    sm: { wrap: 'w-8 h-8', heart: 'w-4 h-4', pin: 'w-3 h-3', text: 'text-base', sub: 'text-[10px]' },
    md: { wrap: 'w-12 h-12', heart: 'w-6 h-6', pin: 'w-4 h-4', text: 'text-xl', sub: 'text-xs' },
    lg: { wrap: 'w-20 h-20', heart: 'w-10 h-10', pin: 'w-7 h-7', text: 'text-3xl', sub: 'text-sm' },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.wrap} rounded-2xl bg-gradient-to-br from-[#0089CF] to-[#12AD2B] flex items-center justify-center shadow-lg relative flex-shrink-0`}>
        <Heart className={`${s.heart} text-white`} fill="white" />
        <MapPin className={`${s.pin} text-yellow-300 absolute -bottom-1 -right-1 drop-shadow`} fill="currentColor" />
      </div>
      <div className="leading-tight">
        <p className={`${s.text} font-black text-white tracking-tight`}>Djibouti</p>
        <p className={`${s.sub} font-bold text-white/80 tracking-widest uppercase`}>Rencontre</p>
      </div>
    </div>
  );
}

function LogoDark({ size = 'md' }) {
  const sizes = {
    sm: { wrap: 'w-7 h-7', heart: 'w-3.5 h-3.5', pin: 'w-2.5 h-2.5', text: 'text-sm', sub: 'text-[9px]' },
    md: { wrap: 'w-10 h-10', heart: 'w-5 h-5', pin: 'w-3.5 h-3.5', text: 'text-lg', sub: 'text-[10px]' },
  };
  const s = sizes[size] || sizes['md'];
  return (
    <div className="flex items-center gap-2">
      <div className={`${s.wrap} rounded-xl bg-gradient-to-br from-[#0089CF] to-[#12AD2B] flex items-center justify-center shadow relative flex-shrink-0`}>
        <Heart className={`${s.heart} text-white`} fill="white" />
        <MapPin className={`${s.pin} text-yellow-300 absolute -bottom-0.5 -right-0.5`} fill="currentColor" />
      </div>
      <div className="leading-tight">
        <p className={`${s.text} font-black text-gray-800 tracking-tight`}>Djibouti</p>
        <p className={`${s.sub} font-bold text-gray-400 tracking-widest uppercase`}>Rencontre</p>
      </div>
    </div>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0089CF] to-[#12AD2B] flex items-center justify-center">
      <div className="animate-pulse">
        <Logo size="lg" />
      </div>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'login'
        ? await api.login(form.email, form.password)
        : await api.register(form.email, form.password, form.name);
      localStorage.setItem('token', result.token);
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col">
        <div className={`${G} h-56 flex flex-col items-center justify-end pb-8`}>
          <Logo size="lg" />
        </div>

        <div className="flex-1 px-8 pt-8 pb-10">
          <div className="flex border-b border-gray-200 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 -mb-px transition-colors ${mode === m ? 'border-[#FD297B] text-[#FD297B]' : 'border-transparent text-gray-400'}`}>
                {m === 'login' ? 'Se connecter' : "S'inscrire"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Prénom</label>
                <input type="text" placeholder="Votre prénom" value={form.name} onChange={set('name')} required minLength={2} maxLength={50}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#FD297B] focus:outline-none text-sm transition-colors" />
              </div>
            )}
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Email</label>
              <input type="email" placeholder="votre@email.com" value={form.email} onChange={set('email')} required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#FD297B] focus:outline-none text-sm transition-colors" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min. 8 car., 1 majuscule, 1 chiffre' : '••••••••'}
                  value={form.password} onChange={set('password')} required minLength={8}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-100 focus:border-[#FD297B] focus:outline-none text-sm transition-colors" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className={`w-full py-4 rounded-xl ${G} text-white font-bold text-sm shadow-lg shadow-pink-200 hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 mt-2`}>
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-gray-300 text-xs text-center mt-8">
            En continuant, vous acceptez nos{' '}
            <span className="text-[#FD297B]">Conditions d'utilisation</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── MATCH MODAL ──────────────────────────────────────────────────────────────
function MatchModal({ match, onMessage, onContinue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
        <div className={`${G} p-8 text-center`}>
          <div className="text-4xl mb-3 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-1">C'est un Match !</h2>
          <p className="text-white/80 text-sm mb-5">
            Toi et <strong>{match.name}</strong> vous vous êtes plû 💜
          </p>
          <div className="flex justify-center">
            {match.photo
              ? <img src={match.photo} alt={match.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-white/40 shadow-xl" />
              : <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${match.color} flex items-center justify-center text-2xl font-bold text-white ring-4 ring-white/40 shadow-xl`}>{match.initials}</div>
            }
          </div>
        </div>
        <div className="bg-white p-6 space-y-3">
          <button onClick={onMessage} className={`w-full py-3.5 rounded-full ${G} text-white font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform`}>
            Envoyer un message
          </button>
          <button onClick={onContinue} className="w-full py-3.5 rounded-full border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-300 transition-colors">
            Continuer à explorer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DISCOVER ─────────────────────────────────────────────────────────────────
function DiscoverScreen({ profiles, onAction, swipeAnim, cardPos, isDragging, handlers, loading }) {
  const profile = profiles[0];
  const rot = cardPos.x * 0.07;
  const likeOp  = Math.min(1, Math.max(0, cardPos.x / 80));
  const nopeOp  = Math.min(1, Math.max(0, -cardPos.x / 80));
  const superOp = Math.min(1, Math.max(0, -cardPos.y / 80));

  const cardStyle = () => {
    if (swipeAnim === 'right') return { transform: 'translateX(150%) rotate(20deg)', transition: 'all 0.4s ease' };
    if (swipeAnim === 'left')  return { transform: 'translateX(-150%) rotate(-20deg)', transition: 'all 0.4s ease' };
    if (swipeAnim === 'up')    return { transform: 'translateY(-150%)', transition: 'all 0.4s ease' };
    return {
      transform: `translateX(${cardPos.x}px) translateY(${cardPos.y}px) rotate(${rot}deg)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease',
    };
  };

  return (
    <div className="flex flex-col h-full bg-white"
      onMouseMove={handlers.mouseMove} onMouseUp={handlers.mouseUp} onMouseLeave={handlers.mouseUp}>
      <div className="px-5 pt-12 pb-3 flex items-center justify-center flex-shrink-0">
        <LogoDark size="sm" />
      </div>

      <div className="flex-1 px-4 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center pb-20">
            <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-[#FD297B] animate-spin" />
          </div>
        ) : !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="currentColor" />
            <h3 className="text-gray-700 text-xl font-bold mb-2">Plus de profils !</h3>
            <p className="text-gray-400 text-sm">Reviens plus tard pour de nouvelles rencontres</p>
          </div>
        ) : (
          <>
            <div className="relative flex-1 mb-3" style={{ minHeight: 0 }}>
              {profiles[1] && (
                <div className="absolute inset-x-3 inset-y-2 rounded-2xl bg-gray-100 scale-[0.96] opacity-50" />
              )}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing select-none"
                style={cardStyle()}
                onMouseDown={handlers.mouseDown}
                onTouchStart={handlers.touchStart}
                onTouchMove={handlers.touchMove}
                onTouchEnd={handlers.touchEnd}
              >
                {profile.photo
                  ? <img src={profile.photo} alt={profile.name} className="absolute inset-0 w-full h-full object-cover" />
                  : <div className={`absolute inset-0 bg-gradient-to-br ${profile.color}`} />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

                <div className="absolute top-7 left-6" style={{ opacity: likeOp, transform: 'rotate(-15deg)' }}>
                  <span className="border-4 border-green-400 text-green-400 text-xl font-black px-3 py-1 rounded-xl">LIKE</span>
                </div>
                <div className="absolute top-7 right-6" style={{ opacity: nopeOp, transform: 'rotate(15deg)' }}>
                  <span className="border-4 border-red-400 text-red-400 text-xl font-black px-3 py-1 rounded-xl">NOPE</span>
                </div>
                <div className="absolute top-7 left-1/2 -translate-x-1/2" style={{ opacity: superOp }}>
                  <span className="border-4 border-blue-400 text-blue-400 text-xl font-black px-3 py-1 rounded-xl">SUPER</span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-0.5 rounded-full bg-white/30">
                      <div className="h-full rounded-full bg-white" style={{ width: `${profile.compatibility}%` }} />
                    </div>
                    <span className="text-white text-xs font-bold">{profile.compatibility}%</span>
                  </div>
                  <h2 className="text-white text-2xl font-bold leading-tight">{profile.name}, {profile.age}</h2>
                  <div className="flex items-center gap-1 text-white/75 text-sm mt-0.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{profile.city}</span>
                  </div>
                  <p className="text-white/75 text-sm mt-1.5 line-clamp-2 leading-relaxed">{profile.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {(profile.tags || []).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-white/25 text-white text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-5 py-3 flex-shrink-0">
              <button onClick={() => onAction('pass')}
                className="w-16 h-16 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform hover:border-red-200 group">
                <X className="w-7 h-7 text-gray-300 group-hover:text-red-400 transition-colors" strokeWidth={3} />
              </button>
              <button onClick={() => onAction('superlike')}
                className="rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform hover:border-blue-200 group"
                style={{ width: '52px', height: '52px' }}>
                <Star className="w-5 h-5 text-blue-300 group-hover:text-blue-500 transition-colors" fill="currentColor" />
              </button>
              <button onClick={() => onAction('like')}
                className="w-16 h-16 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform hover:border-pink-200 group">
                <Heart className="w-7 h-7 text-gray-300 group-hover:text-[#FD297B] transition-colors" fill="currentColor" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MATCHES ──────────────────────────────────────────────────────────────────
function MatchCard({ name, photo, initials, color, city, age, online, badge, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
      <Avatar photo={photo} initials={initials} color={color} size={14} online={online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-900 font-bold">{name}</span>
          {online && <span className="text-[10px] text-green-500 font-semibold">● En ligne</span>}
          {badge && !online && <span className="text-[10px] bg-[#0089CF] text-white px-1.5 py-0.5 rounded-full font-bold">UTILISATEUR</span>}
        </div>
        <p className="text-gray-400 text-sm">{city} · {age} ans</p>
      </div>
      <MessageCircle className="w-5 h-5 text-[#FD297B] flex-shrink-0" />
    </button>
  );
}

function MatchesScreen({ matches, userMatches, onChat, loading }) {
  const total = matches.length + userMatches.length;
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">Matchs</h2>
        <p className="text-gray-400 text-sm mt-0.5">{total} match{total !== 1 ? 's' : ''}</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#FD297B] animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-20">
          <Heart className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="currentColor" />
          <h3 className="text-gray-600 text-lg font-bold mb-1">Pas encore de matchs</h3>
          <p className="text-gray-400 text-sm">Continue d'explorer !</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 pb-20">
          {userMatches.map(m => (
            <MatchCard key={`u_${m.matchUserId}`} name={m.name} photo={m.photo} initials={m.initials}
              color={m.color} city={m.city} age={m.age} online={m.online} badge onClick={() => onChat(m)} />
          ))}
          {matches.map(m => (
            <MatchCard key={`p_${m.id}`} name={m.profile?.name} photo={m.profile?.photo}
              initials={m.profile?.initials} color={m.profile?.color}
              city={m.profile?.city} age={m.profile?.age} onClick={() => onChat(m)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
function MessagesScreen({ matches, userMatches, convs, activeConv, activeConvType, setActiveConv, newMsg, setNewMsg, onSend, onOpen, loadingConv, endRef }) {
  if (activeConv) {
    const key = `${activeConvType === 'user' ? 'u' : 'p'}_${activeConv}`;
    const messages = convs[key] || [];
    let name, photo, initials, color, online = false, isUser = activeConvType === 'user';
    if (isUser) {
      const um = userMatches.find(m => m.matchUserId === activeConv);
      name = um?.name; photo = um?.photo; initials = um?.initials; color = um?.color; online = !!um?.online;
    } else {
      const pm = matches.find(m => m.profileId === activeConv);
      name = pm?.profile?.name; photo = pm?.profile?.photo;
      initials = pm?.profile?.initials; color = pm?.profile?.color;
    }

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setActiveConv(null)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <Avatar photo={photo} initials={initials} color={color} size={10} online={isUser && online} />
          <div>
            <p className="text-gray-900 font-bold leading-tight">{name}</p>
            <p className={`text-xs font-medium ${isUser && online ? 'text-green-500' : 'text-gray-400'}`}>
              {isUser ? (online ? '● En ligne maintenant' : 'Utilisateur réel · messages en direct') : 'Profil'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
          {loadingConv ? (
            <div className="flex justify-center pt-8">
              <div className="w-6 h-6 rounded-full border-4 border-gray-200 border-t-[#FD297B] animate-spin" />
            </div>
          ) : messages.map((msg, i) => (
            <div key={msg._id || i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.from === 'me'
                  ? `${G} text-white rounded-br-sm`
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2.5 flex-shrink-0">
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()}
            placeholder="Message..." maxLength={1000}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-gray-200 transition-colors" />
          <button onClick={onSend} disabled={!newMsg.trim()}
            className={`w-10 h-10 rounded-full ${G} flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform`}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  const allConvs = [
    ...userMatches.map(m => ({ ...m, convKey: `u_${m.matchUserId}`, isUser: true, name: m.name, photo: m.photo, initials: m.initials, color: m.color, convId: m.matchUserId })),
    ...matches.map(m => ({ ...m, convKey: `p_${m.profileId}`, isUser: false, name: m.profile?.name, photo: m.profile?.photo, initials: m.profile?.initials, color: m.profile?.color, convId: m.profileId })),
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
      </div>
      {allConvs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-20">
          <MessageCircle className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-600 text-lg font-bold mb-1">Aucun message</h3>
          <p className="text-gray-400 text-sm">Matchez pour commencer à discuter !</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 pb-20">
          {allConvs.map(m => {
            const msgs = convs[m.convKey] || [];
            const last = msgs[msgs.length - 1];
            return (
              <button key={m.convKey} onClick={() => { setActiveConv(m.convId, m.isUser ? 'user' : 'profile'); onOpen(m.convId, m.isUser ? 'user' : 'profile'); }}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <Avatar photo={m.photo} initials={m.initials} color={m.color} size={14} online={m.isUser && m.online} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-gray-900 font-bold truncate">{m.name}</span>
                      {m.isUser && m.online && <span className="text-[9px] text-green-500 font-bold flex-shrink-0">● En ligne</span>}
                      {m.isUser && !m.online && <span className="text-[9px] bg-[#0089CF] text-white px-1 py-0.5 rounded-full font-bold flex-shrink-0">LIVE</span>}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm truncate mt-0.5">
                    {last ? (last.from === 'me' ? 'Vous : ' : '') + last.text : 'Nouveau match ! 🎉'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileScreen({ user, setUser, onLogout, onAdmin }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setDraft(user); }, [user]);

  const set = (k) => (e) => setDraft(d => ({ ...d, [k]: e.target.value }));

  const save = async () => {
    setSaving(true); setError('');
    try {
      const updated = await api.updateProfile(draft);
      setUser(updated); setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="relative flex-shrink-0">
        <div className={`h-40 ${G}`} />
        <div className="absolute inset-x-0 bottom-0 translate-y-1/2 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FD297B] to-[#FF655B] flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white shadow-xl">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mt-14 px-5 text-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">
          {user.name}{user.age ? `, ${user.age}` : ''}
        </h2>
        {user.city && (
          <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mt-1">
            <MapPin className="w-3.5 h-3.5" /><span>{user.city}</span>
          </div>
        )}
      </div>

      <div className="px-5 space-y-4 pb-28">
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end">
          <button onClick={() => editing ? save() : setEditing(true)} disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${editing ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
            {editing
              ? <><Check className="w-4 h-4" />{saving ? 'Sauvegarde...' : 'Sauvegarder'}</>
              : <><Edit3 className="w-4 h-4" />Modifier</>}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Prénom</label>
                <input value={draft.name || ''} onChange={set('name')}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#FD297B] focus:outline-none" />
              </div>
              <div style={{ width: '80px' }}>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Âge</label>
                <input type="number" min="18" max="100" value={draft.age || ''} onChange={set('age')}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#FD297B] focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Ville</label>
              <input value={draft.city || ''} onChange={set('city')}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#FD297B] focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Bio</label>
              <textarea value={draft.bio || ''} onChange={set('bio')} rows={3} maxLength={500}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#FD297B] focus:outline-none resize-none" />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h4 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">À propos</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{user.bio || 'Aucune bio ajoutée.'}</p>
            {(user.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-[#FD297B]/10 text-[#FD297B] text-xs font-medium">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-4">
          <h4 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Compte</h4>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4">
          <h4 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3">🔒 Sécurité active</h4>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2"><span className="text-green-500">✅</span> Mot de passe chiffré (bcrypt 12 rounds)</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✅</span> Session sécurisée (JWT 7 jours)</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✅</span> Protection anti-bruteforce (rate limit)</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✅</span> Headers HTTP sécurisés (helmet)</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✅</span> Protection XSS & injection</div>
          </div>
        </div>

        {user.isAdmin && (
          <button onClick={onAdmin}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0089CF] to-[#12AD2B] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-transform">
            <Shield className="w-4 h-4" />Panneau Administrateur
          </button>
        )}

        <button onClick={onLogout} className="w-full py-3.5 rounded-2xl border-2 border-red-100 text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />Se déconnecter
        </button>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, setActive, matchCount }) {
  const tabs = [
    { id: 'discover',  Icon: Heart,          label: 'Découvrir' },
    { id: 'matches',   Icon: Heart,          label: 'Matchs',   badge: matchCount },
    { id: 'messages',  Icon: MessageCircle,  label: 'Messages' },
    { id: 'profile',   Icon: User,           label: 'Profil' },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex justify-around py-2 pb-3">
        {tabs.map(({ id, Icon, label, badge }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => setActive(id)} className="relative flex flex-col items-center gap-0.5 px-4 py-1.5">
              <div className="relative">
                <Icon className={`w-6 h-6 transition-colors ${on ? 'text-[#FD297B]' : 'text-gray-300'}`}
                  fill={on ? '#FD297B' : 'none'} strokeWidth={on ? 0 : 1.5} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#FD297B] rounded-full text-white text-[9px] flex items-center justify-center font-bold px-0.5">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${on ? 'text-[#FD297B]' : 'text-gray-300'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState]   = useState('loading');
  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState('discover');

  const [profiles, setProfiles]           = useState([]);
  const [loadingProfiles, setLoadingP]    = useState(false);
  const [swipeAnim, setSwipeAnim]         = useState(null);
  const [cardPos, setCardPos]             = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]       = useState(false);
  const [dragStart, setDragStart]         = useState({ x: 0, y: 0 });
  const [showMatch, setShowMatch]         = useState(null);

  const [matches, setMatches]             = useState([]);
  const [userMatches, setUserMatches]     = useState([]);
  const [loadingMatches, setLoadingM]     = useState(false);
  const [convs, setConvs]                 = useState({});
  const [activeConv, setActiveConv]       = useState(null);
  const [activeConvType, setActiveConvType] = useState('profile');
  const [newMsg, setNewMsg]               = useState('');
  const [loadingConv, setLoadingConv]     = useState(false);
  const endRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAppState('auth'); return; }
    api.getMe()
      .then(u => { setUser(u); setAppState('main'); })
      .catch(() => { localStorage.removeItem('token'); setAppState('auth'); });
  }, []);

  useEffect(() => {
    if (appState === 'main' && activeTab === 'discover' && profiles.length === 0 && !loadingProfiles)
      loadProfiles();
  }, [appState, activeTab]);

  useEffect(() => {
    if (appState === 'main' && (activeTab === 'matches' || activeTab === 'messages'))
      loadMatches();
  }, [appState, activeTab]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [convs, activeConv]);

  useEffect(() => {
    if (!swipeAnim) return;
    const t = setTimeout(() => {
      setSwipeAnim(null); setCardPos({ x: 0, y: 0 });
      setProfiles(p => p.slice(1));
    }, 420);
    return () => clearTimeout(t);
  }, [swipeAnim]);

  // Polling messages pour les convs user-to-user
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeConv && activeConvType === 'user') {
      pollRef.current = setInterval(() => loadConv(activeConv, 'user'), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv, activeConvType]);

  // Heartbeat toutes les 30 secondes
  useEffect(() => {
    if (appState !== 'main') return;
    api.heartbeat().catch(() => {});
    const hb = setInterval(() => api.heartbeat().catch(() => {}), 30000);
    return () => clearInterval(hb);
  }, [appState]);

  const loadProfiles = async () => {
    setLoadingP(true);
    try {
      const [profileData, userData] = await Promise.all([
        api.getProfiles(),
        api.discoverUsers().catch(() => []),
      ]);
      const mixed = [...profileData, ...userData].sort(() => Math.random() - 0.5);
      setProfiles(mixed);
    }
    catch (e) { console.error(e); }
    finally { setLoadingP(false); }
  };

  const loadMatches = async () => {
    setLoadingM(true);
    try {
      const [profileMatches, uMatches] = await Promise.all([
        api.getMatches(),
        api.getUserMatches().catch(() => []),
      ]);
      setMatches(profileMatches);
      setUserMatches(uMatches);
      const updates = {};
      for (const m of profileMatches) {
        const msgs = await api.getMessages(m.profileId);
        updates[`p_${m.profileId}`] = msgs.map(msg => ({ ...msg, from: msg.from === user?.id ? 'me' : 'them' }));
      }
      for (const m of uMatches) {
        const msgs = await api.getUserMessages(m.matchUserId);
        updates[`u_${m.matchUserId}`] = msgs.map(msg => ({ ...msg, from: msg.from === user?.id ? 'me' : 'them' }));
      }
      setConvs(updates);
    } catch (e) { console.error(e); }
    finally { setLoadingM(false); }
  };

  const loadConv = async (convId, type = 'profile') => {
    setLoadingConv(true);
    try {
      const key = `${type === 'user' ? 'u' : 'p'}_${convId}`;
      const msgs = type === 'user'
        ? await api.getUserMessages(convId)
        : await api.getMessages(convId);
      setConvs(prev => ({
        ...prev,
        [key]: msgs.map(m => ({ ...m, from: m.from === user?.id ? 'me' : 'them' })),
      }));
    } catch (e) { console.error(e); }
    finally { setLoadingConv(false); }
  };

  const handleAction = async (action) => {
    if (!profiles[0] || swipeAnim) return;
    const profile = profiles[0];

    if (action === 'superlike') setSwipeAnim('up');
    else if (action === 'like') setSwipeAnim('right');
    else setSwipeAnim('left');

    try {
      const result = profile.isUser
        ? await api.swipeUser(profile.id, action)
        : await api.swipe(profile.id, action);
      if (result.isMatch) {
        setTimeout(async () => { setShowMatch(profile); await loadMatches(); }, 500);
      }
    } catch (e) { console.error(e); }
  };

  const mouseDown  = (e) => { e.preventDefault(); setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); };
  const mouseMove  = (e) => { if (!isDragging) return; setCardPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const mouseUp    = ()  => {
    if (!isDragging) return; setIsDragging(false);
    if (cardPos.x > 80) handleAction('like');
    else if (cardPos.x < -80) handleAction('pass');
    else if (cardPos.y < -80) handleAction('superlike');
    else setCardPos({ x: 0, y: 0 });
  };
  const touchStart = (e) => { const t = e.touches[0]; setIsDragging(true); setDragStart({ x: t.clientX, y: t.clientY }); };
  const touchMove  = (e) => { if (!isDragging) return; const t = e.touches[0]; setCardPos({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y }); };
  const touchEnd   = ()  => {
    if (!isDragging) return; setIsDragging(false);
    if (cardPos.x > 70) handleAction('like');
    else if (cardPos.x < -70) handleAction('pass');
    else if (cardPos.y < -70) handleAction('superlike');
    else setCardPos({ x: 0, y: 0 });
  };

  const sendMessage = async () => {
    const text = newMsg.trim();
    if (!text || !activeConv) return;
    const key = `${activeConvType === 'user' ? 'u' : 'p'}_${activeConv}`;
    setNewMsg('');
    setConvs(prev => ({ ...prev, [key]: [...(prev[key] || []), { _id: Date.now(), from: 'me', text }] }));
    try {
      if (activeConvType === 'user') {
        await api.sendUserMessage(activeConv, text);
      } else {
        await api.sendMessage(activeConv, text);
        const replies = ["C'est super ! 😊", "Vraiment ? Raconte-moi !", "Haha j'adore ! 💜", "Tu es trop sympa !", "On devrait se rencontrer 🌟"];
        setTimeout(() => {
          setConvs(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), { _id: Date.now() + 1, from: 'them', text: replies[Math.floor(Math.random() * replies.length)] }],
          }));
        }, 1500);
      }
    } catch (e) { console.error(e); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null); setProfiles([]); setMatches([]); setUserMatches([]); setConvs({});
    setAppState('auth');
  };

  if (appState === 'loading') return <LoadingScreen />;
  if (appState === 'auth')   return <AuthScreen onLogin={u => { setUser(u); setAppState('main'); }} />;
  if (appState === 'admin')  return <AdminPanel onBack={() => setAppState('main')} />;

  const handlers = { mouseDown, mouseMove, mouseUp, touchStart, touchMove, touchEnd };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-[430px] h-screen flex flex-col bg-white relative overflow-hidden shadow-2xl">
        {showMatch && (
          <MatchModal
            match={showMatch}
            onMessage={() => { setShowMatch(null); setActiveConv(showMatch.id); setActiveTab('messages'); }}
            onContinue={() => setShowMatch(null)}
          />
        )}

        <div className="flex-1 overflow-hidden pb-16">
          {activeTab === 'discover' && (
            <DiscoverScreen
              profiles={profiles} onAction={handleAction}
              swipeAnim={swipeAnim} cardPos={cardPos} isDragging={isDragging}
              handlers={handlers} loading={loadingProfiles}
            />
          )}
          {activeTab === 'matches' && (
            <MatchesScreen
              matches={matches} userMatches={userMatches} loading={loadingMatches}
              onChat={m => {
                if (m.matchUserId) {
                  setActiveConv(m.matchUserId); setActiveConvType('user');
                  setActiveTab('messages'); loadConv(m.matchUserId, 'user');
                } else {
                  setActiveConv(m.profileId); setActiveConvType('profile');
                  setActiveTab('messages'); loadConv(m.profileId, 'profile');
                }
              }}
            />
          )}
          {activeTab === 'messages' && (
            <MessagesScreen
              matches={matches} userMatches={userMatches} convs={convs}
              activeConv={activeConv} activeConvType={activeConvType}
              setActiveConv={(id, type) => { setActiveConv(id); setActiveConvType(type || 'profile'); }}
              newMsg={newMsg} setNewMsg={setNewMsg}
              onSend={sendMessage}
              onOpen={(id, type) => loadConv(id, type)}
              loadingConv={loadingConv} endRef={endRef}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen user={user} setUser={setUser} onLogout={logout} onAdmin={() => setAppState('admin')} />
          )}
        </div>

        <BottomNav
          active={activeTab}
          setActive={tab => { setActiveTab(tab); if (tab !== 'messages') setActiveConv(null); }}
          matchCount={matches.length}
        />
      </div>
    </div>
  );
}
