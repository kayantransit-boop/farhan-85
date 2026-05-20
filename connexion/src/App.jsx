import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, X, Star, MessageCircle, User, Shield,
  ChevronLeft, Send, MapPin, Edit3, Check, Eye, EyeOff, LogOut, Mail, Camera,
  SlidersHorizontal, Moon, Sun, Flag, Ban, CheckCheck, AlertCircle, Flame, UserPlus, Copy
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
  const img  = { sm: 'w-8 h-8',  md: 'w-12 h-12', lg: 'w-20 h-20' }[size];
  const text = { sm: 'text-base', md: 'text-xl',   lg: 'text-3xl'  }[size];
  const sub  = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm'   }[size];
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="Djibouti Rencontre" className={`${img} drop-shadow-lg flex-shrink-0`} />
      <div className="leading-tight">
        <p className={`${text} font-black text-white tracking-tight`}>Djibouti</p>
        <p className={`${sub} font-bold text-white/80 tracking-widest uppercase`}>Rencontre</p>
      </div>
    </div>
  );
}

function LogoDark({ size = 'md' }) {
  const img  = { sm: 'w-7 h-7',    md: 'w-10 h-10'   }[size] || 'w-10 h-10';
  const text = { sm: 'text-sm',    md: 'text-lg'      }[size] || 'text-lg';
  const sub  = { sm: 'text-[9px]', md: 'text-[10px]'  }[size] || 'text-[10px]';
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.svg" alt="Djibouti Rencontre" className={`${img} drop-shadow flex-shrink-0`} />
      <div className="leading-tight">
        <p className={`${text} font-black text-gray-800 tracking-tight`}>Djibouti</p>
        <p className={`${sub} font-bold text-gray-400 tracking-widest uppercase`}>Rencontre</p>
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
// Redimensionne et compresse une image côté client (max 320px, qualité 0.75)
function resizeImage(file, maxSize = 320, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

// ─── PWA INSTALL BUTTON ───────────────────────────────────────────────────────
function InstallButton() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed || !prompt) return null;

  const install = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  };

  return (
    <button onClick={install}
      className="w-full py-3.5 flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold text-base rounded-2xl border border-white/30 active:scale-95 transition-transform">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
      </svg>
      Installer l'application
    </button>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LegalPage({ page, onBack }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const isPrivacy = page === 'privacy';

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white/95 backdrop-blur">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <p className="font-black text-gray-900 text-base">
            {isPrivacy ? 'Politique de confidentialité' : "Conditions d'utilisation"}
          </p>
          <p className="text-gray-400 text-xs">Djibouti Rencontre — Dernière mise à jour : mai 2025</p>
        </div>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto space-y-8 text-gray-700 text-sm leading-relaxed">

        {isPrivacy ? (
          <>
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">1. Introduction</h2>
              <p>Djibouti Rencontre (« nous », « notre ») exploite la plateforme accessible à l'adresse <strong>djib-rencontre.site</strong>. Nous nous engageons à protéger vos données personnelles. Cette politique explique quelles données nous collectons, comment nous les utilisons et quels sont vos droits.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">2. Données collectées</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Données d'inscription :</strong> nom, adresse e-mail, mot de passe (chiffré).</li>
                <li><strong>Données de profil :</strong> âge, ville, photo, biographie, centres d'intérêt.</li>
                <li><strong>Données d'utilisation :</strong> likes, matchs, messages échangés.</li>
                <li><strong>Données techniques :</strong> adresse IP, horodatage de connexion, type d'appareil.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">3. Utilisation des données</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Créer et gérer votre compte utilisateur.</li>
                <li>Vous proposer des profils compatibles.</li>
                <li>Permettre la messagerie entre membres matchés.</li>
                <li>Assurer la sécurité de la plateforme et prévenir les abus.</li>
                <li>Améliorer nos services via des analyses anonymisées.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">4. Partage des données</h2>
              <p>Nous ne vendons jamais vos données personnelles à des tiers. Vos informations peuvent être partagées uniquement :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Avec les autres membres (nom, âge, ville, photo, bio — visibles sur votre profil public).</li>
                <li>Avec nos prestataires techniques (hébergement Vercel, base de données MongoDB Atlas) dans le cadre strict de la fourniture du service.</li>
                <li>Si la loi djiboutienne ou une décision judiciaire l'exige.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">5. Conservation des données</h2>
              <p>Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre compte, vos données personnelles sont effacées dans un délai de 30 jours, à l'exception des données requises par des obligations légales.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">6. Sécurité</h2>
              <p>Nous protégeons vos données par :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Chiffrement HTTPS (TLS) pour toutes les communications.</li>
                <li>Hachage des mots de passe (bcrypt).</li>
                <li>Authentification par jeton JWT à durée limitée.</li>
                <li>Limitation du nombre de tentatives de connexion.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">7. Cookies et publicités</h2>
              <p>Notre site utilise des cookies essentiels au bon fonctionnement du service. Nous pouvons également afficher des publicités via <strong>Google AdSense</strong>, qui utilise des cookies pour personnaliser les annonces selon vos centres d'intérêt. Vous pouvez gérer vos préférences publicitaires sur <a href="https://adssettings.google.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">adssettings.google.com</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">8. Vos droits</h2>
              <p>Vous avez le droit de :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Accéder à vos données personnelles.</li>
                <li>Corriger des informations inexactes.</li>
                <li>Demander la suppression de votre compte et de vos données.</li>
                <li>Vous opposer à certains traitements.</li>
              </ul>
              <p className="mt-2">Pour exercer ces droits, contactez-nous : <a href="mailto:contact@djib-rencontre.site" className="text-blue-600 underline">contact@djib-rencontre.site</a></p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">9. Contact</h2>
              <p>Responsable du traitement : Djibouti Rencontre<br />
              E-mail : <a href="mailto:contact@djib-rencontre.site" className="text-blue-600 underline">contact@djib-rencontre.site</a><br />
              Site : <a href="https://djib-rencontre.site" className="text-blue-600 underline">djib-rencontre.site</a></p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">1. Acceptation des conditions</h2>
              <p>En créant un compte sur Djibouti Rencontre, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, vous ne pouvez pas utiliser le service.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">2. Accès au service</h2>
              <p>Le service est accessible gratuitement à toute personne :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Âgée d'au moins <strong>18 ans</strong>.</li>
                <li>Disposant d'une adresse e-mail valide.</li>
                <li>Résidant ou ayant des liens avec Djibouti.</li>
              </ul>
              <p className="mt-2">Tout compte appartenant à une personne mineure sera immédiatement supprimé.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">3. Règles de comportement</h2>
              <p>En utilisant Djibouti Rencontre, vous vous engagez à :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Fournir des informations sincères et exactes sur votre profil.</li>
                <li>Utiliser votre vraie photo personnelle.</li>
                <li>Respecter tous les membres sans discrimination, harcèlement ni insulte.</li>
                <li>Ne pas partager de contenu à caractère sexuel explicite, violent ou illégal.</li>
                <li>Ne pas usurper l'identité d'une autre personne.</li>
                <li>Ne pas utiliser le service à des fins commerciales non autorisées.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">4. Messagerie</h2>
              <p>La messagerie est réservée aux membres ayant matché mutuellement. Tout message à caractère harcelant, menaçant ou offensant peut entraîner la suspension immédiate du compte concerné.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">5. Signalements et modération</h2>
              <p>Tout membre peut signaler un profil ou un message inapproprié. Notre équipe de modération examine chaque signalement et peut prendre les mesures suivantes : avertissement, suspension temporaire ou suppression définitive du compte.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">6. Propriété intellectuelle</h2>
              <p>Le contenu de la plateforme (logo, design, code, textes) est la propriété exclusive de Djibouti Rencontre. Tout usage non autorisé est interdit. En publiant du contenu (photos, textes), vous accordez à Djibouti Rencontre une licence non exclusive d'utilisation pour le fonctionnement du service.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">7. Responsabilité</h2>
              <p>Djibouti Rencontre met tout en œuvre pour assurer la sécurité et la disponibilité du service, mais ne peut garantir :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>L'exactitude des informations fournies par les membres.</li>
                <li>La compatibilité ou le succès des rencontres.</li>
                <li>Une disponibilité ininterrompue du service.</li>
              </ul>
              <p className="mt-2">Djibouti Rencontre n'est pas responsable des interactions entre membres en dehors de la plateforme.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">8. Suppression de compte</h2>
              <p>Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application. Djibouti Rencontre se réserve le droit de supprimer tout compte ne respectant pas les présentes CGU, sans préavis.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">9. Modifications</h2>
              <p>Ces CGU peuvent être mises à jour à tout moment. Les membres seront informés de toute modification importante. L'utilisation continue du service après notification vaut acceptation des nouvelles conditions.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">10. Droit applicable</h2>
              <p>Les présentes CGU sont régies par le droit de la République de Djibouti. Tout litige sera soumis aux tribunaux compétents de Djibouti-Ville.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-3">11. Contact</h2>
              <p>Pour toute question relative aux présentes CGU :<br />
              E-mail : <a href="mailto:contact@djib-rencontre.site" className="text-blue-600 underline">contact@djib-rencontre.site</a></p>
            </section>
          </>
        )}

        <div className="pt-4 border-t border-gray-100">
          <button onClick={onBack}
            className="w-full py-3.5 font-bold text-white rounded-2xl text-sm"
            style={{ background: 'linear-gradient(135deg, #0089CF, #12AD2B)' }}>
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
}

function LandingScreen({ onLogin, onRegister }) {
  const [legalPage, setLegalPage] = useState(null);
  const [stats, setStats] = useState([
    { value: '…', label: 'Membres actifs' },
    { value: '…', label: 'Matchs réalisés' },
    { value: '…', label: 'En ligne maintenant' },
  ]);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const load = () => {
      fetch(`${BASE}/stats`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d) return;
          const fmt = n => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + ' k+' : String(n);
          setStats([
            { value: fmt(d.totalUsers),  label: 'Membres actifs' },
            { value: fmt(d.totalMatches), label: 'Matchs réalisés' },
            { value: String(d.onlineNow), label: 'En ligne maintenant' },
          ]);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30000); // rafraîchit toutes les 30s
    return () => clearInterval(id);
  }, []);

  const steps = [
    { num: '01', title: 'Crée ton profil', desc: 'Quelques secondes suffisent. Ajoute tes photos et une courte bio.' },
    { num: '02', title: 'Explore & swipe', desc: 'Découvre des profils près de toi. Like, superlike ou passe.' },
    { num: '03', title: 'Chat & rencontre', desc: 'Lorsque c\'est un match, discutez librement. Les utilisateurs en ligne peuvent être contactés directement.' },
  ];

  const features = [
    { icon: '🟢', title: 'En ligne en temps réel', desc: 'Vois qui est connecté et envoie un message immédiatement, sans attendre un match.' },
    { icon: '🔒', title: 'Profils vérifiés', desc: 'Chaque compte est contrôlé. Signalement et blocage disponibles pour ta sécurité.' },
    { icon: '💬', title: 'Chat instantané', desc: 'Messages lus, notifications sonores, et historique de conversation complet.' },
    { icon: '🌍', title: 'Partout à Djibouti', desc: 'Filtre par ville, âge, et trouve des personnes proches de toi.' },
  ];

  const testimonials = [
    { name: 'Amina K.', city: 'Djibouti-Ville', text: 'J\'ai trouvé quelqu\'un de formidable en moins d\'une semaine. L\'interface est simple et agréable.', color: 'from-pink-400 to-rose-500', rating: 5 },
    { name: 'Omar H.', city: 'Ali Sabieh', text: 'Super application, très facile à utiliser. J\'apprécie beaucoup le chat en temps réel.', color: 'from-blue-400 to-cyan-500', rating: 5 },
    { name: 'Hodan M.', city: 'Tadjoura', text: 'Enfin une appli de rencontre faite pour nous. Je recommande à tous !', color: 'from-violet-400 to-purple-600', rating: 5 },
  ];

  if (legalPage) return <LegalPage page={legalPage} onBack={() => setLegalPage(null)} />;

  return (
    <div className="min-h-screen bg-white overflow-y-auto">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0089CF 0%, #0ab872 50%, #12AD2B 100%)' }}>
        {/* Cercles décoratifs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/5" />

        {/* Nav */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-12 pb-2">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Djibouti Rencontre" className="w-9 h-9 drop-shadow" />
            <span className="text-white font-black text-lg tracking-tight">Djibouti Rencontre</span>
          </div>
          <button onClick={onLogin} className="text-white/90 font-semibold text-sm border border-white/30 px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors">
            Connexion
          </button>
        </div>

        {/* Hero content */}
        <div className="relative z-10 px-6 pt-10 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <span className="text-white text-xs font-semibold">98 personnes en ligne maintenant</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Trouve l'amour<br/>
            <span className="text-yellow-300">près de chez toi</span>
          </h1>
          <p className="text-white/80 text-base mb-8 leading-relaxed">
            La première application de rencontre dédiée à Djibouti.<br/>
            Des rencontres authentiques, des connexions réelles.
          </p>

          {/* Mock swipe card */}
          <div className="relative mx-auto w-48 h-64 mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl shadow-2xl rotate-6 opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-600 rounded-3xl shadow-2xl -rotate-3 opacity-70" />
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
              <div className="flex-1 bg-gradient-to-br from-[#0089CF] to-[#12AD2B] flex items-center justify-center">
                <span className="text-5xl font-black text-white">A</span>
              </div>
              <div className="p-3 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-900 text-sm">Amina, 24</p>
                    <p className="text-gray-400 text-xs">📍 Djibouti-Ville</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-green-500 font-bold">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />En ligne
                  </span>
                </div>
              </div>
            </div>
            {/* Like badge */}
            <div className="absolute top-4 right-2 bg-green-400 text-white font-black text-xs px-2.5 py-1 rounded-full rotate-12 shadow-lg border-2 border-white">
              LIKE ❤️
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={onRegister}
              className="w-full py-4 bg-white font-black text-base rounded-2xl shadow-xl active:scale-95 transition-transform"
              style={{ color: '#0089CF' }}>
              Commencer gratuitement →
            </button>
            <button onClick={onLogin}
              className="w-full py-3.5 bg-white/15 backdrop-blur-sm text-white font-semibold text-base rounded-2xl border border-white/30 active:scale-95 transition-transform">
              J'ai déjà un compte
            </button>
            <InstallButton />
          </div>
          <p className="text-white/40 text-[11px] mt-3">Gratuit · Sans engagement · 100% Djibouti</p>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="flex divide-x divide-gray-200">
          {stats.map((s, i) => (
            <div key={i} className="flex-1 text-center py-5 px-2">
              <p className="text-2xl font-black" style={{ color: '#0089CF' }}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMMENT ÇA MARCHE ── */}
      <div className="px-6 py-12">
        <p className="text-xs font-bold tracking-widest text-center mb-2" style={{ color: '#0089CF' }}>COMMENT ÇA MARCHE</p>
        <h2 className="text-2xl font-black text-gray-900 text-center mb-8">3 étapes pour trouver<br/>quelqu'un de spécial</h2>
        <div className="space-y-6">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #0089CF, #12AD2B)' }}>
                {s.num}
              </div>
              <div className="pt-1">
                <p className="font-black text-gray-900 text-base">{s.title}</p>
                <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FONCTIONNALITÉS ── */}
      <div className="px-6 py-10 bg-gray-50">
        <p className="text-xs font-bold tracking-widest text-center mb-2" style={{ color: '#12AD2B' }}>FONCTIONNALITÉS</p>
        <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Tout ce qu'il te faut<br/>pour bien rencontrer</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <p className="font-bold text-gray-900 text-sm mb-1">{f.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TÉMOIGNAGES ── */}
      <div className="px-6 py-12">
        <p className="text-xs font-bold tracking-widest text-center mb-2" style={{ color: '#0089CF' }}>TÉMOIGNAGES</p>
        <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Ils ont trouvé<br/>leur match ❤️</h2>
        <div className="space-y-4">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-base`}>
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">📍 {t.city}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(t.rating)].map((_, j) => <span key={j} className="text-yellow-400 text-sm">★</span>)}
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed italic">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div className="mx-6 mb-10 rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #0089CF 0%, #12AD2B 100%)' }}>
        <h2 className="text-2xl font-black text-white mb-2">Prêt(e) à te lancer ?</h2>
        <p className="text-white/70 text-sm mb-6">Rejoins des milliers de Djiboutiens qui ont déjà trouvé leur match.</p>
        <button onClick={onRegister}
          className="w-full py-4 bg-white font-black text-base rounded-2xl shadow-xl active:scale-95 transition-transform mb-3"
          style={{ color: '#0089CF' }}>
          Créer mon profil gratuit
        </button>
        <button onClick={onLogin}
          className="w-full py-3 text-white/80 font-medium text-sm">
          J'ai déjà un compte → Se connecter
        </button>
      </div>

      {/* ── FOOTER ── */}
      <div className="bg-gray-900 px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          <img src="/logo.svg" alt="Djibouti Rencontre" className="w-8 h-8 drop-shadow" />
          <span className="text-white font-black">Djibouti Rencontre</span>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed mb-4">
          La plateforme de rencontre #1 à Djibouti. Rencontres sérieuses et authentiques.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 border-t border-gray-800 pt-4">
          <span>© 2025 Djibouti Rencontre</span>
          <button onClick={() => setLegalPage('privacy')} className="cursor-pointer hover:text-gray-300 bg-transparent border-0 p-0 text-xs text-gray-500">Confidentialité</button>
          <button onClick={() => setLegalPage('terms')} className="cursor-pointer hover:text-gray-300 bg-transparent border-0 p-0 text-xs text-gray-500">Conditions d'utilisation</button>
          <a href="mailto:contact@djib-rencontre.site" className="hover:text-gray-300">Contact</a>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-800 text-center">
          <span className="text-[11px] text-gray-600 tracking-widest uppercase">Conçu &amp; développé par </span>
          <span className="text-[12px] font-black bg-gradient-to-r from-[#0089CF] to-[#12AD2B] bg-clip-text text-transparent tracking-wide">Farhan</span>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [photo, setPhoto] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const photoRef = useRef();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setPhoto(base64);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await api.forgotPassword(form.email);
        setSuccess('Si cet email existe, un lien de réinitialisation vous a été envoyé.');
        return;
      }
      const result = mode === 'login'
        ? await api.login(form.email, form.password)
        : await api.register(form.email, form.password, form.name, photo);
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
          {mode === 'forgot' ? (
            <div className="mb-4">
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Mot de passe oublié</h3>
              <p className="text-gray-400 text-sm mb-4">Entrez votre email pour recevoir un lien de réinitialisation.</p>
            </div>
          ) : (
            <div className="flex border-b border-gray-200 mb-6">
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setPhoto(''); setError(''); setSuccess(''); }}
                  className={`flex-1 pb-3 text-sm font-bold border-b-2 -mb-px transition-colors ${mode === m ? 'border-[#FD297B] text-[#FD297B]' : 'border-transparent text-gray-400'}`}>
                  {m === 'login' ? 'Se connecter' : "S'inscrire"}
                </button>
              ))}
            </div>
          )}

          {error && <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">{error}</div>}
          {success && <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Photo de profil */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  <button type="button" onClick={() => photoRef.current.click()}
                    className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-dashed border-gray-200 hover:border-[#FD297B] transition-colors group">
                    {photo
                      ? <img src={photo} alt="photo" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-1">
                          <Camera className="w-7 h-7 text-gray-300 group-hover:text-[#FD297B] transition-colors" />
                          <span className="text-[10px] text-gray-300 group-hover:text-[#FD297B]">Photo</span>
                        </div>
                    }
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </button>
                  <p className="text-[10px] text-gray-400">Appuyez pour ajouter une photo</p>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Prénom</label>
                  <input type="text" placeholder="Votre prénom" value={form.name} onChange={set('name')} required minLength={2} maxLength={50}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#FD297B] focus:outline-none text-sm transition-colors" />
                </div>
              </>
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
              {loading ? 'Chargement...' : mode === 'forgot' ? 'Envoyer le lien' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          {mode === 'login' && (
            <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} className="block text-center text-[#0089CF] text-xs font-medium mt-4 hover:underline">
              Mot de passe oublié ?
            </button>
          )}

          <p className="text-gray-300 text-xs text-center mt-6">
            En continuant, vous acceptez nos{' '}
            <span className="text-[#FD297B]">Conditions d'utilisation</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── FILTER MODAL ─────────────────────────────────────────────────────────────
function FilterModal({ filters, onApply, onClose }) {
  const [f, setF] = useState(filters);
  const set = k => e => setF(prev => ({ ...prev, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold text-gray-900 mb-5">Filtres de recherche</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-2">Âge minimum</label>
            <input type="number" min="18" max="80" value={f.minAge || ''} onChange={set('minAge')} placeholder="18"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#0089CF] focus:outline-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-2">Âge maximum</label>
            <input type="number" min="18" max="100" value={f.maxAge || ''} onChange={set('maxAge')} placeholder="60"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#0089CF] focus:outline-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-2">Ville</label>
            <input type="text" value={f.city || ''} onChange={set('city')} placeholder="Ex: Djibouti"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#0089CF] focus:outline-none text-sm" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { setF({}); onApply({}); }} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-bold text-sm hover:border-gray-300 transition-colors">
            Réinitialiser
          </button>
          <button onClick={() => onApply(f)} className={`flex-1 py-3 rounded-xl ${G} text-white font-bold text-sm`}>
            Appliquer
          </button>
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
function DiscoverScreen({ profiles, onAction, swipeAnim, cardPos, isDragging, handlers, loading, onFilter, swipeRemaining }) {
  const profile = profiles[0];
  const [photoIdx, setPhotoIdx] = useState(0);
  const allPhotos = profile ? [profile.photo, ...(profile.photos || [])].filter(Boolean) : [];
  useEffect(() => { setPhotoIdx(0); }, [profile?.id]);
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
      <div className="px-5 pt-12 pb-3 flex items-center justify-between flex-shrink-0">
        <LogoDark size="sm" />
        <div className="flex items-center gap-2">
          {swipeRemaining !== null && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${swipeRemaining > 10 ? 'bg-green-50 text-green-600' : swipeRemaining > 0 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
              <Flame className="w-3 h-3" />{swipeRemaining} restants
            </div>
          )}
          <button onClick={onFilter} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          </button>
        </div>
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
                {allPhotos.length > 0
                  ? <img src={allPhotos[photoIdx]} alt={profile.name} className="absolute inset-0 w-full h-full object-cover" />
                  : <div className={`absolute inset-0 bg-gradient-to-br ${profile.color}`} />
                }
                {allPhotos.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
                    {allPhotos.map((_, i) => (
                      <button key={i} onClick={e => { e.stopPropagation(); setPhotoIdx(i); }}
                        className={`h-1 rounded-full transition-all ${i === photoIdx ? 'w-6 bg-white' : 'w-3 bg-white/50'}`} />
                    ))}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

                {/* Pastille statut en ligne — coin supérieur droit */}
                {profile.isUser && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    {profile.online
                      ? <><span className="relative flex w-2.5 h-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-green-400" /></span><span className="text-white text-[10px] font-bold tracking-wide">En ligne</span></>
                      : <><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /><span className="text-white/70 text-[10px] font-bold tracking-wide">Hors ligne</span></>
                    }
                  </div>
                )}

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white text-2xl font-bold leading-tight">{profile.name}, {profile.age}</h2>
                    {profile.isUser && profile.online && (
                      <span className="px-2 py-0.5 rounded-full bg-green-400/90 text-white text-xs font-black tracking-wide">● En ligne</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/75 text-sm mt-0.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{profile.city}</span>
                    {profile.isUser && <span className="text-white/50 text-xs ml-1">· utilisateur réel</span>}
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

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function ProfileModal({ profile, onClose, onChat, onReport, onBlock }) {
  if (!profile) return null;
  const { name, photo, initials, color, city, age, bio, tags, online } = profile;
  const [reported, setReported] = useState(false);
  const [blocked, setBlocked] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-sm bg-white rounded-t-3xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}>
        {/* Header photo / avatar */}
        <div className={`relative h-56 bg-gradient-to-br ${color || 'from-[#0089CF] to-[#12AD2B]'} flex items-center justify-center`}>
          {photo
            ? <img src={photo} alt={initials} className="w-full h-full object-cover" />
            : <span className="text-7xl font-black text-white/90">{initials}</span>
          }
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
          {online && (
            <span className="absolute bottom-3 left-4 text-xs font-bold text-white bg-green-500 px-2.5 py-1 rounded-full">● En ligne</span>
          )}
        </div>

        {/* Info */}
        <div className="px-5 pt-4 pb-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{name}</h2>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />{city} · {age} ans
              </p>
            </div>
          </div>

          {bio && <p className="text-gray-700 text-sm leading-relaxed mt-3">{bio}</p>}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map(t => (
                <span key={t} className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">{t}</span>
              ))}
            </div>
          )}

          <button onClick={() => { onClose(); onChat(); }}
            className={`w-full mt-5 py-3 rounded-2xl ${G} text-white font-bold text-sm flex items-center justify-center gap-2`}>
            <MessageCircle className="w-4 h-4" />
            Envoyer un message
          </button>
          {profile.isUser && (
            <div className="flex gap-2 mt-2">
              <button onClick={async () => { await onReport?.(profile.id); setReported(true); }}
                disabled={reported}
                className="flex-1 py-2.5 rounded-2xl border border-orange-200 text-orange-500 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-orange-50 transition-colors disabled:opacity-40">
                <Flag className="w-3.5 h-3.5" />{reported ? 'Signalé' : 'Signaler'}
              </button>
              <button onClick={async () => { await onBlock?.(profile.id); setBlocked(true); onClose(); }}
                disabled={blocked}
                className="flex-1 py-2.5 rounded-2xl border border-red-200 text-red-500 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors disabled:opacity-40">
                <Ban className="w-3.5 h-3.5" />{blocked ? 'Bloqué' : 'Bloquer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MATCHES ──────────────────────────────────────────────────────────────────
function MatchCard({ name, photo, initials, color, city, age, online, badge, onClick, onProfile }) {
  return (
    <div className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
      <button onClick={online ? onClick : (onProfile || onClick)} className="flex-shrink-0">
        <Avatar photo={photo} initials={initials} color={color} size={14} online={online} />
      </button>
      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-900 font-bold">{name}</span>
          {online && <span className="text-[10px] text-green-500 font-semibold">● En ligne</span>}
          {badge && !online && <span className="text-[10px] bg-gray-400 text-white px-1.5 py-0.5 rounded-full font-bold">Hors ligne</span>}
        </div>
        <p className="text-gray-400 text-sm">{city} · {age} ans</p>
        {badge && !online && (
          <div className="flex items-center gap-1.5 mt-1.5 bg-[#0089CF]/10 rounded-full px-2.5 py-1 self-start">
            <Mail className="w-3 h-3 text-[#0089CF]" />
            <span className="text-[10px] text-[#0089CF] font-bold">Écrire un message</span>
          </div>
        )}
      </button>
      <button onClick={onClick} className="flex-shrink-0">
        {online
          ? <MessageCircle className="w-5 h-5 text-green-500" fill="currentColor" />
          : <Mail className="w-5 h-5 text-[#0089CF]" />
        }
      </button>
    </div>
  );
}

function MatchesScreen({ matches, userMatches, onlineUsers, onChat, onChatDirect, loading, onReport, onBlock }) {
  const [viewingProfile, setViewingProfile] = useState(null);
  const total = matches.length + userMatches.length;
  // Utilisateurs en ligne qui ne sont pas déjà dans les matchs
  const matchedIds = new Set(userMatches.map(m => m.matchUserId));
  const newOnline = (onlineUsers || []).filter(u => !matchedIds.has(u.id));

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">Matchs</h2>
        <p className="text-gray-400 text-sm mt-0.5">{total} match{total !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Section utilisateurs en ligne (sans match) */}
        {newOnline.length > 0 && (
          <div>
            <div className="px-5 py-3 flex items-center gap-2 bg-green-50 border-b border-green-100">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">En ligne maintenant · {newOnline.length}</span>
            </div>
            {newOnline.map(u => (
              <div key={`online_${u.id}`} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                <div className="flex-shrink-0">
                  <Avatar photo={u.photo} initials={u.initials} color={u.color} size={14} online />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-900 font-bold">{u.name}</span>
                    <span className="text-[10px] text-green-500 font-semibold">● En ligne</span>
                  </div>
                  <p className="text-gray-400 text-sm">{u.city} · {u.age} ans</p>
                </div>
                <button
                  onClick={() => onChatDirect(u)}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Écrire
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Matchs existants */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#FD297B] animate-spin" />
          </div>
        ) : total === 0 && newOnline.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 py-20">
            <Heart className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="currentColor" />
            <h3 className="text-gray-600 text-lg font-bold mb-1">Pas encore de matchs</h3>
            <p className="text-gray-400 text-sm">Continue d'explorer !</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {total > 0 && (
              <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Matchs · {total}</span>
              </div>
            )}
            {userMatches.map(m => (
              <MatchCard key={`u_${m.matchUserId}`} name={m.name} photo={m.photo} initials={m.initials}
                color={m.color} city={m.city} age={m.age} online={m.online} badge
                onClick={() => onChat(m)}
                onProfile={() => setViewingProfile({ ...m, chatData: m })} />
            ))}
            {matches.map(m => (
              <MatchCard key={`p_${m.id}`} name={m.profile?.name} photo={m.profile?.photo}
                initials={m.profile?.initials} color={m.profile?.color}
                city={m.profile?.city} age={m.profile?.age}
                onClick={() => onChat(m)} />
            ))}
          </div>
        )}
      </div>
      <ProfileModal
        profile={viewingProfile}
        onClose={() => setViewingProfile(null)}
        onChat={() => viewingProfile && onChat(viewingProfile.chatData)}
        onReport={onReport}
        onBlock={id => { onBlock?.(id); setViewingProfile(null); }}
      />
    </div>
  );
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
function MessagesScreen({ matches, userMatches, onlineUsers, convs, activeConv, activeConvType, setActiveConv, newMsg, setNewMsg, onSend, onOpen, loadingConv, endRef }) {
  if (activeConv) {
    const key = `${activeConvType === 'user' ? 'u' : 'p'}_${activeConv}`;
    const messages = convs[key] || [];
    let name, photo, initials, color, online = false, isUser = activeConvType === 'user';
    if (isUser) {
      const um = userMatches.find(m => m.matchUserId === activeConv);
      const ou = (onlineUsers || []).find(u => u.id === activeConv);
      name = um?.name || ou?.name; photo = um?.photo || ou?.photo;
      initials = um?.initials || ou?.initials; color = um?.color || ou?.color;
      online = !!(um?.online || ou);
    } else {
      const pm = matches.find(m => m.profileId === activeConv);
      name = pm?.profile?.name; photo = pm?.profile?.photo;
      initials = pm?.profile?.initials; color = pm?.profile?.color;
    }

    const [chatProfileOpen, setChatProfileOpen] = useState(false);
    const um = isUser ? userMatches.find(m => m.matchUserId === activeConv) : null;

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setActiveConv(null)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={() => isUser && setChatProfileOpen(true)} className={isUser ? 'cursor-pointer' : 'cursor-default'}>
            <Avatar photo={photo} initials={initials} color={color} size={10} online={isUser && online} />
          </button>
          <button onClick={() => isUser && setChatProfileOpen(true)} className={`flex-1 text-left ${isUser ? 'cursor-pointer' : 'cursor-default'}`}>
            <p className="text-gray-900 font-bold leading-tight">{name}</p>
            {isUser && online && (
              <p className="text-xs font-medium text-green-500">● En ligne maintenant</p>
            )}
            {isUser && !online && (
              <div className="flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-[#0089CF]" />
                <span className="text-xs font-medium text-[#0089CF]">Hors ligne · il verra votre message</span>
              </div>
            )}
            {!isUser && (
              <p className="text-xs font-medium text-gray-400">Profil</p>
            )}
          </button>
        </div>
        {isUser && chatProfileOpen && (
          <ProfileModal
            profile={um}
            onClose={() => setChatProfileOpen(false)}
            onChat={() => setChatProfileOpen(false)}
          />
        )}

        {isUser && !online && (
          <div className="bg-[#E8F4FB] border-b border-[#BEE0F5] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#0089CF]/15 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-[#0089CF]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-[#0069A0]">{name?.split(' ')[0] || 'Cette personne'} est hors ligne</p>
              <p className="text-[11px] text-[#4A9FC0] leading-snug mt-0.5">Écrivez votre message maintenant — il/elle le recevra dès sa reconnexion et pourra vous répondre.</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
          {loadingConv ? (
            <div className="flex justify-center pt-8">
              <div className="w-6 h-6 rounded-full border-4 border-gray-200 border-t-[#FD297B] animate-spin" />
            </div>
          ) : messages.map((msg, i) => {
            const isMe = msg.from === 'me';
            const isRead = isMe && Array.isArray(msg.readBy) && msg.readBy.length > 0;
            const isLast = i === messages.length - 1;
            return (
              <div key={msg._id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe ? `${G} text-white rounded-br-sm` : 'bg-white text-gray-800 rounded-bl-sm shadow-sm dk-msg-them'
                }`}>
                  {msg.text}
                </div>
                {isMe && isLast && (
                  <div className={`flex items-center gap-0.5 mt-0.5 text-[10px] ${isRead ? 'text-[#0089CF]' : 'text-gray-300'}`}>
                    <CheckCheck className="w-3 h-3" />
                    <span>{isRead ? 'Lu' : 'Envoyé'}</span>
                  </div>
                )}
              </div>
            );
          })}
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
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-gray-900 font-bold truncate">{m.name}</span>
                    {m.isUser && m.online && <span className="text-[9px] text-green-500 font-bold flex-shrink-0">● En ligne</span>}
                    {m.isUser && !m.online && <span className="text-[9px] text-gray-400 font-bold flex-shrink-0">Hors ligne</span>}
                  </div>
                  <p className="text-gray-400 text-sm truncate mt-0.5">
                    {last ? (last.from === 'me' ? 'Vous : ' : '') + last.text : 'Nouveau match ! 🎉'}
                  </p>
                  {m.isUser && !m.online && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-[#0089CF]" />
                      <span className="text-[10px] text-[#0089CF] font-medium">Écrire · il répondra à sa reconnexion</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── INVITE BUTTON ────────────────────────────────────────────────────────────
function InviteButton() {
  const [copied, setCopied] = useState(false);
  const APP_URL = 'https://djib-rencontre.site';
  const MSG = `💚 Rejoins-moi sur Djibouti Rencontre — la 1ère app de rencontre djiboutienne !\n👉 ${APP_URL}`;

  const handleInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Djibouti Rencontre', text: MSG, url: APP_URL });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(MSG);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <button onClick={handleInvite}
      className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      style={{ background: 'linear-gradient(135deg, #0089CF 0%, #12AD2B 100%)', color: 'white' }}>
      {copied
        ? <><Copy className="w-4 h-4" />Lien copié !</>
        : <><UserPlus className="w-4 h-4" />Inviter un ami</>
      }
    </button>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileScreen({ user, setUser, onLogout, onAdmin, darkMode, setDarkMode }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [saving, setSaving] = useState(false);
  const photoRef = useRef();

  const handleAddPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file, 480, 0.8);
    setDraft(d => ({ ...d, photos: [...(d.photos || []), base64].slice(0, 5) }));
  };
  const removePhoto = (idx) => setDraft(d => ({ ...d, photos: (d.photos || []).filter((_, i) => i !== idx) }));
  const [error, setError] = useState('');

  useEffect(() => { setDraft(user); }, [user]);

  const set = (k) => (e) => setDraft(d => ({ ...d, [k]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setDraft(d => ({ ...d, photo: base64 }));
  };

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
          <div className="relative">
            {draft.photo || user.photo
              ? <img src={editing ? (draft.photo || user.photo) : user.photo} alt={user.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-xl" />
              : <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FD297B] to-[#FF655B] flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white shadow-xl">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
            }
            {editing && (
              <>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                <button type="button" onClick={() => photoRef.current.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FD297B] flex items-center justify-center shadow-lg border-2 border-white">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </>
            )}
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

        {/* Galerie photos */}
        {editing && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h4 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3">Galerie photos ({(draft.photos || []).length}/5)</h4>
            <div className="flex flex-wrap gap-2">
              {(draft.photos || []).map((p, i) => (
                <div key={i} className="relative w-16 h-16">
                  <img src={p} alt="" className="w-full h-full rounded-xl object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">×</button>
                </div>
              ))}
              {(draft.photos || []).length < 5 && (
                <>
                  <input ref={photoRef} type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />
                  <button type="button" onClick={() => photoRef.current.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#0089CF] transition-colors">
                    <Camera className="w-5 h-5 text-gray-400" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Dark mode toggle */}
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-4 h-4 text-[#0089CF]" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            <span className="text-sm font-semibold text-gray-700">{darkMode ? 'Mode sombre' : 'Mode clair'}</span>
          </div>
          <button onClick={() => setDarkMode(d => !d)}
            className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-[#0089CF]' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <InviteButton />

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

// ─── TOAST NOTIFICATION ───────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-[380px] pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-3 bg-gray-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl animate-slide-down">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0089CF] to-[#12AD2B] flex items-center justify-center text-sm font-bold flex-shrink-0">
            {t.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-green-400">{t.sender}</p>
            <p className="text-sm truncate">{t.text}</p>
          </div>
          <MessageCircle className="w-4 h-4 text-white/40 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, setActive, matchCount, unreadCount }) {
  const tabs = [
    { id: 'discover',  Icon: Heart,          label: 'Découvrir' },
    { id: 'matches',   Icon: Heart,          label: 'Matchs',   badge: matchCount },
    { id: 'messages',  Icon: MessageCircle,  label: 'Messages', badge: unreadCount },
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
  const [darkMode, setDarkMode]   = useState(() => localStorage.getItem('darkMode') === '1');
  const [authMode, setAuthMode]   = useState('login');
  const [filters, setFilters]     = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [swipeRemaining, setSwipeRemaining] = useState(null);

  const [profiles, setProfiles]           = useState([]);
  const [loadingProfiles, setLoadingP]    = useState(false);
  const [swipeAnim, setSwipeAnim]         = useState(null);
  const [cardPos, setCardPos]             = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]       = useState(false);
  const [dragStart, setDragStart]         = useState({ x: 0, y: 0 });
  const [showMatch, setShowMatch]         = useState(null);

  const [matches, setMatches]             = useState([]);
  const [userMatches, setUserMatches]     = useState([]);
  const [onlineUsers, setOnlineUsers]     = useState([]);
  const [loadingMatches, setLoadingM]     = useState(false);
  const [convs, setConvs]                 = useState({});
  const [activeConv, setActiveConv]       = useState(null);
  const [activeConvType, setActiveConvType] = useState('profile');
  const [newMsg, setNewMsg]               = useState('');
  const [loadingConv, setLoadingConv]     = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [toasts, setToasts]               = useState([]);
  const endRef   = useRef(null);
  const pollRef  = useRef(null);
  const seenRef  = useRef({});   // { convKey: lastMessageCount }

  const pushToast = (sender, initials, text) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, sender, initials, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const playNotifSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Note 1 : ding aigu
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.connect(g1); g1.connect(ctx.destination);
      o1.type = 'sine';
      o1.frequency.setValueAtTime(1046, ctx.currentTime);
      o1.frequency.exponentialRampToValueAtTime(1318, ctx.currentTime + 0.08);
      g1.gain.setValueAtTime(0.25, ctx.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o1.start(ctx.currentTime);
      o1.stop(ctx.currentTime + 0.4);
      // Note 2 : écho grave
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.type = 'sine';
      o2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      g2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      o2.start(ctx.currentTime + 0.12);
      o2.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  const notify = (sender, initials, text) => {
    pushToast(sender, initials, text);
    playNotifSound();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`💬 ${sender}`, { body: text, icon: '/icon-192.png', badge: '/icon-192.png' });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAppState('landing'); return; }
    api.getMe()
      .then(u => { setUser(u); setAppState('main'); })
      .catch(() => { localStorage.removeItem('token'); setAppState('landing'); });
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

  // Polling messages pour les convs user-to-user (silencieux = sans spinner)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeConv && activeConvType === 'user') {
      pollRef.current = setInterval(() => loadConv(activeConv, 'user', true), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv, activeConvType]);

  // Polling utilisateurs en ligne toutes les 15s
  useEffect(() => {
    if (appState !== 'main') return;
    const fetch = () => api.getOnlineUsers().then(setOnlineUsers).catch(() => {});
    fetch();
    const t = setInterval(fetch, 15000);
    return () => clearInterval(t);
  }, [appState]);

  // Dark mode persistence
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode ? '1' : '0');
  }, [darkMode]);

  // Swipe remaining au démarrage
  useEffect(() => {
    if (appState === 'main') api.getSwipeRemaining().then(r => setSwipeRemaining(r.remaining)).catch(() => {});
  }, [appState]);

  // Mark as read quand on ouvre une conv user
  useEffect(() => {
    if (activeConv && activeConvType === 'user') {
      api.markRead(activeConv).catch(() => {});
    }
  }, [activeConv, activeConvType]);

  // Heartbeat toutes les 30 secondes
  useEffect(() => {
    if (appState !== 'main') return;
    api.heartbeat().catch(() => {});
    const hb = setInterval(() => api.heartbeat().catch(() => {}), 30000);
    return () => clearInterval(hb);
  }, [appState]);

  // Demander permission notifications au démarrage
  useEffect(() => {
    if (appState === 'main' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [appState]);

  const loadProfiles = async (f = filters) => {
    setLoadingP(true);
    try {
      const [profileData, userData] = await Promise.all([
        api.getProfiles(),
        api.discoverUsers(f).catch(() => []),
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
    } catch (e) { console.error(e); }
    finally { setLoadingM(false); }
  };

  const myId = user?._id || user?.id;

  const loadConv = async (convId, type = 'profile', silent = false) => {
    if (!silent) setLoadingConv(true);
    try {
      const key = `${type === 'user' ? 'u' : 'p'}_${convId}`;
      const msgs = type === 'user'
        ? await api.getUserMessages(convId)
        : await api.getMessages(convId);
      const mapped = msgs.map(m => ({ ...m, from: m.from === myId ? 'me' : 'them' }));

      // Détecter les nouveaux messages de l'autre personne
      if (silent) {
        const prevCount = seenRef.current[key] ?? mapped.length;
        const newOnes = mapped.slice(prevCount).filter(m => m.from === 'them');
        if (newOnes.length > 0) {
          const match = userMatches.find(m => m.matchUserId === convId);
          const sender = match?.name || 'Nouveau message';
          const initials = match?.initials || '??';
          newOnes.forEach(m => notify(sender, initials, m.text));
          // Badge non-lu si l'onglet Messages n'est pas actif
          setUnreadCount(prev => prev + newOnes.length);
        }
        seenRef.current[key] = mapped.length;
      } else {
        seenRef.current[key] = mapped.length;
      }

      setConvs(prev => ({ ...prev, [key]: mapped }));
    } catch (e) { console.error(e); }
    finally { if (!silent) setLoadingConv(false); }
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
      if (result.remaining !== undefined) setSwipeRemaining(result.remaining);
      else api.getSwipeRemaining().then(r => setSwipeRemaining(r.remaining)).catch(() => {});
    } catch (e) {
      if (e.message?.includes('Limite')) setSwipeRemaining(0);
      console.error(e);
    }
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
  if (appState === 'landing') return <LandingScreen onLogin={() => { setAppState('auth'); setAuthMode('login'); }} onRegister={() => { setAppState('auth'); setAuthMode('register'); }} />;
  if (appState === 'auth')   return <AuthScreen onLogin={u => { setUser(u); setAppState('main'); }} initialMode={authMode} />;
  if (appState === 'admin')  return <AdminPanel onBack={() => setAppState('main')} />;

  const handlers = { mouseDown, mouseMove, mouseUp, touchStart, touchMove, touchEnd };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark bg-gray-950' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-[430px] h-screen flex flex-col relative overflow-hidden shadow-2xl ${darkMode ? 'dk-card' : 'bg-white'}`}>
        <Toast toasts={toasts} />
        {showFilter && (
          <FilterModal
            filters={filters}
            onApply={f => { setFilters(f); setProfiles([]); loadProfiles(f); setShowFilter(false); }}
            onClose={() => setShowFilter(false)}
          />
        )}
        {showMatch && (
          <MatchModal
            match={showMatch}
            onMessage={() => {
              const type = showMatch.isUser ? 'user' : 'profile';
              setShowMatch(null);
              setActiveConv(showMatch.id);
              setActiveConvType(type);
              setActiveTab('messages');
              loadConv(showMatch.id, type);
            }}
            onContinue={() => setShowMatch(null)}
          />
        )}

        <div className="flex-1 overflow-hidden pb-16">
          {activeTab === 'discover' && (
            <DiscoverScreen
              profiles={profiles} onAction={handleAction}
              swipeAnim={swipeAnim} cardPos={cardPos} isDragging={isDragging}
              handlers={handlers} loading={loadingProfiles}
              onFilter={() => setShowFilter(true)}
              swipeRemaining={swipeRemaining}
            />
          )}
          {activeTab === 'matches' && (
            <MatchesScreen
              matches={matches} userMatches={userMatches} onlineUsers={onlineUsers} loading={loadingMatches}
              onReport={id => api.reportUser(id, '').catch(() => {})}
              onBlock={id => api.blockUser(id).then(() => { loadMatches(); setProfiles(p => p.filter(u => u.id !== id)); }).catch(() => {})}
              onChat={m => {
                if (m.matchUserId) {
                  setActiveConv(m.matchUserId); setActiveConvType('user');
                  setActiveTab('messages'); loadConv(m.matchUserId, 'user');
                } else {
                  setActiveConv(m.profileId); setActiveConvType('profile');
                  setActiveTab('messages'); loadConv(m.profileId, 'profile');
                }
              }}
              onChatDirect={u => {
                setActiveConv(u.id); setActiveConvType('user');
                setActiveTab('messages'); loadConv(u.id, 'user');
              }}
            />
          )}
          {activeTab === 'messages' && (
            <MessagesScreen
              matches={matches} userMatches={userMatches} onlineUsers={onlineUsers} convs={convs}
              activeConv={activeConv} activeConvType={activeConvType}
              setActiveConv={(id, type) => { setActiveConv(id); setActiveConvType(type || 'profile'); }}
              newMsg={newMsg} setNewMsg={setNewMsg}
              onSend={sendMessage}
              onOpen={(id, type) => loadConv(id, type)}
              loadingConv={loadingConv} endRef={endRef}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen user={user} setUser={setUser} onLogout={logout} onAdmin={() => setAppState('admin')} darkMode={darkMode} setDarkMode={setDarkMode} />
          )}
        </div>

        <BottomNav
          active={activeTab}
          setActive={tab => {
            setActiveTab(tab);
            if (tab !== 'messages') setActiveConv(null);
            if (tab === 'messages') setUnreadCount(0);
          }}
          matchCount={matches.length}
          unreadCount={unreadCount}
        />
      </div>
    </div>
  );
}
