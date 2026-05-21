import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Shield, Users, Heart, MessageCircle, Activity,
  Trash2, Edit3, Check, X, Star, Ban, Crown, KeyRound, Eye, EyeOff
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const G = 'bg-gradient-to-r from-[#0089CF] to-[#12AD2B]';

function req(method, path, body) {
  const token = localStorage.getItem('token');
  return fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-black text-gray-900">{value ?? '–'}</p>
      <p className="text-gray-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#0089CF] focus:outline-none transition-colors";

// ─── STATS TAB ────────────────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    req('GET', '/admin/stats').then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-16"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#0089CF] animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">Vue d'ensemble de la plateforme</p>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users}         label="Utilisateurs"  value={stats?.totalUsers}    color="bg-[#0089CF]" />
        <StatCard icon={Heart}         label="Matchs"        value={stats?.totalMatches}  color="bg-[#FD297B]" />
        <StatCard icon={MessageCircle} label="Messages"      value={stats?.totalMessages} color="bg-purple-500" />
        <StatCard icon={Activity}      label="Swipes"        value={stats?.totalSwipes}   color="bg-orange-500" />
      </div>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    req('GET', '/admin/users').then(setUsers).catch(console.error).finally(() => setLoading(false));
  };

  const startEdit = (u) => { setEditing(u); setDraft({ name: u.name, age: u.age, city: u.city, bio: u.bio, isAdmin: u.isAdmin, isBanned: u.isBanned }); setError(''); };

  const save = async () => {
    setSaving(true); setError('');
    try {
      await req('PUT', `/admin/users/${editing.id}`, draft);
      setEditing(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const del = async (u) => {
    if (!confirm(`Supprimer ${u.name} ?`)) return;
    try { await req('DELETE', `/admin/users/${u.id}`); load(); }
    catch (e) { alert(e.message); }
  };

  const set = (k) => (e) => setDraft(d => ({ ...d, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (loading) return <div className="flex justify-center pt-16"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#0089CF] animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-gray-400 text-sm">{users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
      {users.map(u => (
        <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0089CF] to-[#12AD2B] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {u.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-gray-900 text-sm">{u.name}</span>
                {u.isAdmin && <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" />}
                {u.isBanned && <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              </div>
              <p className="text-gray-400 text-xs truncate">{u.email}</p>
              <p className="text-gray-400 text-xs">{u.city} · {u.age} ans</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => startEdit(u)} className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <Edit3 className="w-3.5 h-3.5 text-blue-500" />
              </button>
              {!u.isAdmin && (
                <button onClick={() => del(u)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {editing && (
        <Modal title={`Modifier — ${editing.name}`} onClose={() => setEditing(null)}>
          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-500 text-sm">{error}</div>}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1"><Field label="Prénom"><input value={draft.name || ''} onChange={set('name')} className={inp} /></Field></div>
              <div style={{width:'75px'}}><Field label="Âge"><input type="number" value={draft.age || ''} onChange={set('age')} className={inp} /></Field></div>
            </div>
            <Field label="Ville"><input value={draft.city || ''} onChange={set('city')} className={inp} /></Field>
            <Field label="Bio"><textarea value={draft.bio || ''} onChange={set('bio')} rows={2} className={`${inp} resize-none`} /></Field>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!draft.isAdmin} onChange={set('isAdmin')} className="w-4 h-4 accent-yellow-500" />
                <span className="text-sm text-gray-700">Administrateur</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!draft.isBanned} onChange={set('isBanned')} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">Banni</span>
              </label>
            </div>
            <button onClick={save} disabled={saving}
              className={`w-full py-3 rounded-xl ${G} text-white font-bold text-sm disabled:opacity-60`}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CHANGE PASSWORD MODAL ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow]       = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = (k) => () => setShow(s => ({ ...s, [k]: !s[k] }));

  const submit = async () => {
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    setSaving(true);
    try {
      await req('PUT', '/admin/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <Modal title="Mot de passe modifié" onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-7 h-7 text-green-500" />
          </div>
          <p className="text-gray-600 text-sm text-center">Ton mot de passe admin a été changé avec succès.</p>
          <button onClick={onClose} className={`w-full py-3 rounded-xl ${G} text-white font-bold text-sm`}>
            Fermer
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Changer le mot de passe" onClose={onClose}>
      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-500 text-sm">{error}</div>}
      <div className="space-y-3">
        <Field label="Mot de passe actuel">
          <div className="relative">
            <input
              type={show.current ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={set('currentPassword')}
              placeholder="••••••••"
              className={`${inp} pr-10`}
            />
            <button type="button" onClick={toggle('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Nouveau mot de passe">
          <div className="relative">
            <input
              type={show.new ? 'text' : 'password'}
              value={form.newPassword}
              onChange={set('newPassword')}
              placeholder="Min 8 car., 1 majuscule, 1 chiffre"
              className={`${inp} pr-10`}
            />
            <button type="button" onClick={toggle('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Confirmer le nouveau mot de passe">
          <div className="relative">
            <input
              type={show.confirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              placeholder="••••••••"
              className={`${inp} pr-10`}
            />
            <button type="button" onClick={toggle('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <button onClick={submit} disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
          className={`w-full py-3 rounded-xl ${G} text-white font-bold text-sm disabled:opacity-50 mt-2`}>
          {saving ? 'Modification...' : 'Changer le mot de passe'}
        </button>
      </div>
    </Modal>
  );
}

// ─── MATCHES TAB ──────────────────────────────────────────────────────────────
function MatchesTab() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    req('GET', '/admin/matches').then(setMatches).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-16"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#0089CF] animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-gray-400 text-sm">{matches.length} match{matches.length !== 1 ? 's' : ''} au total</p>
      {matches.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun match pour l'instant</div>
      ) : matches.map((m, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Heart className="w-5 h-5 text-[#FD297B] flex-shrink-0" fill="#FD297B" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm">
              <span className="text-[#0089CF]">{m.userName}</span>
              {' '}❤️{' '}
              <span className="text-[#FD297B]">{m.profileName}</span>
            </p>
            <p className="text-gray-400 text-xs mt-0.5">{new Date(m.date).toLocaleDateString('fr-FR')}</p>
          </div>
          {m.superliked && <Star className="w-4 h-4 text-blue-400 fill-blue-400 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ─── MESSAGES TAB ─────────────────────────────────────────────────────────────
function MessagesTab() {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    req('GET', '/admin/messages').then(setConvs).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-16"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#0089CF] animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-gray-400 text-sm">{convs.length} conversation{convs.length !== 1 ? 's' : ''}</p>
      {convs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucune conversation</div>
      ) : convs.map((c, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-mono truncate">{c.convId}</span>
            <span className="text-xs font-bold text-[#0089CF] flex-shrink-0 ml-2">{c.count} msg</span>
          </div>
          <p className="text-gray-600 text-sm truncate">"{c.last}"</p>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ADMIN ───────────────────────────────────────────────────────────────
export default function AdminPanel({ onBack }) {
  const [tab, setTab] = useState('stats');
  const [showChangePwd, setShowChangePwd] = useState(false);

  const tabs = [
    { id: 'stats',    label: 'Stats',     icon: Activity },
    { id: 'users',    label: 'Membres',   icon: Users },
    { id: 'matches',  label: 'Matchs',    icon: Star },
    { id: 'messages', label: 'Messages',  icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-[430px] h-screen flex flex-col bg-gray-50 relative overflow-hidden">
        {/* Header */}
        <div className={`${G} px-5 pt-12 pb-4 flex items-center gap-3 flex-shrink-0`}>
          <button onClick={onBack} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <Shield className="w-6 h-6 text-white" />
          <div className="flex-1">
            <h1 className="text-white font-black text-lg leading-tight">Administration</h1>
            <p className="text-white/70 text-xs">Djibouti-Rencontre</p>
          </div>
          <button onClick={() => setShowChangePwd(true)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Changer le mot de passe">
            <KeyRound className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 flex-shrink-0 transition-colors border-b-2 ${tab === id ? 'border-[#0089CF] text-[#0089CF]' : 'border-transparent text-gray-400'}`}>
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
          {tab === 'stats'    && <StatsTab />}
          {tab === 'users'    && <UsersTab />}
          {tab === 'matches'  && <MatchesTab />}
          {tab === 'messages' && <MessagesTab />}
        </div>

        {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
      </div>
    </div>
  );
}
