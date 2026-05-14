require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) { console.error('FATAL: JWT_SECRET manquant dans .env'); process.exit(1); }

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('FATAL: MONGODB_URI manquant dans .env'); process.exit(1); }

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── MONGOOSE SCHEMAS ─────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  _id: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, default: 25 },
  city: { type: String, default: '' },
  bio: { type: String, default: '' },
  tags: { type: [String], default: [] },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  photo: { type: String, default: '' },
}, { timestamps: true });

const profileSchema = new mongoose.Schema({
  _id: String,
  name: String,
  age: Number,
  city: String,
  bio: { type: String, default: '' },
  tags: { type: [String], default: [] },
  initials: String,
  color: String,
  compatibility: Number,
  photo: { type: String, default: '' },
});

const swipeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  profileId: { type: String, required: true },
  action: { type: String, enum: ['like', 'pass', 'superlike'] },
  date: { type: Date, default: Date.now },
});
swipeSchema.index({ userId: 1, profileId: 1 }, { unique: true });

const matchSchema = new mongoose.Schema({
  _id: String,
  userId: { type: String, required: true },
  profileId: { type: String, required: true },
  superliked: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  _id: String,
  convId: { type: String, required: true, index: true },
  from: String,
  text: String,
  date: { type: Date, default: Date.now },
});

const userSwipeSchema = new mongoose.Schema({
  fromUserId: { type: String, required: true },
  toUserId:   { type: String, required: true },
  action: { type: String, enum: ['like', 'pass', 'superlike'] },
  date: { type: Date, default: Date.now },
});
userSwipeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

const userMatchSchema = new mongoose.Schema({
  _id:    String,
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const User      = mongoose.model('User',      userSchema);
const Profile   = mongoose.model('Profile',   profileSchema);
const Swipe     = mongoose.model('Swipe',     swipeSchema);
const Match     = mongoose.model('Match',     matchSchema);
const Message   = mongoose.model('Message',   messageSchema);
const UserSwipe = mongoose.model('UserSwipe', userSwipeSchema);
const UserMatch = mongoose.model('UserMatch', userMatchSchema);

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL.split(',').map(u => u.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function sanitize(str, max = 500) {
  return String(str || '').replace(/[<>"'`]/g, '').trim().slice(0, max);
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

async function adminAuth(req, res, next) {
  auth(req, res, async () => {
    const user = await User.findById(req.user.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Accès administrateur requis' });
    }
    next();
  });
}

// ─── INIT DATA ────────────────────────────────────────────────────────────────

async function initData() {
  const adminEmail = 'admin@djibouti-rencontre.dj';
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    await User.create({
      _id: uuidv4(),
      email: adminEmail,
      password: bcrypt.hashSync('Admin@2025!', 12),
      name: 'Administrateur',
      age: 30,
      city: 'Djibouti',
      bio: 'Compte administrateur',
      tags: [],
      isAdmin: true,
    });
    console.log('\n👑 Compte admin créé :');
    console.log('   Email    : admin@djibouti-rencontre.dj');
    console.log('   Password : Admin@2025!\n');
  }

  const profileCount = await Profile.countDocuments();
  if (profileCount === 0) {
    const SEED = [
      { _id: 'profile-1',  name: 'Amina',   age: 24, city: 'Djibouti',    bio: 'Passionnée de voyages et de photographie. Je cherche quelqu\'un pour explorer le monde ensemble 🌍', tags: ['Voyage','Photo','Yoga','Cuisine'],            initials: 'AM', color: 'from-pink-400 to-purple-500',   compatibility: 87 },
      { _id: 'profile-2',  name: 'Lucas',   age: 28, city: 'Djibouti',    bio: 'Musicien le week-end, développeur la semaine. Fan de jazz et de bonne bouffe 🎸',                    tags: ['Musique','Cuisine','Tech','Cinéma'],          initials: 'LC', color: 'from-blue-400 to-cyan-500',     compatibility: 72 },
      { _id: 'profile-3',  name: 'Sofia',   age: 22, city: 'Djibouti',    bio: 'Étudiante en architecture, je vois le monde comme une œuvre d\'art à construire ✨',                  tags: ['Art','Voyage','Sport','Architecture'],        initials: 'SF', color: 'from-orange-400 to-red-500',    compatibility: 91 },
      { _id: 'profile-4',  name: 'Théo',    age: 31, city: 'Djibouti',    bio: 'Amateur de vin et de randonnée. Je cherche quelqu\'un pour partager de belles aventures 🍷',          tags: ['Randonnée','Nature','Sport','Cuisine'],       initials: 'TH', color: 'from-green-400 to-teal-500',    compatibility: 65 },
      { _id: 'profile-5',  name: 'Léa',     age: 26, city: 'Djibouti',    bio: 'Passionnée et grande voyageuse. J\'adore les animaux et les couchers de soleil 🐾',                  tags: ['Animaux','Voyage','Sport','Musique'],         initials: 'LA', color: 'from-yellow-400 to-orange-500', compatibility: 83 },
      { _id: 'profile-6',  name: 'Karim',   age: 29, city: 'Djibouti',    bio: 'Chef cuisinier qui aime partager sa passion. La vie est trop courte pour manger mal 👨‍🍳',             tags: ['Cuisine','Voyage','Cinéma','Sport'],          initials: 'KR', color: 'from-purple-400 to-pink-500',   compatibility: 78 },
      { _id: 'profile-7',  name: 'Marie',   age: 25, city: 'Djibouti',    bio: 'Professeure de yoga et de méditation. À la recherche d\'une connexion authentique 🧘',               tags: ['Yoga','Nature','Lecture','Voyage'],           initials: 'MR', color: 'from-indigo-400 to-blue-500',   compatibility: 89 },
      { _id: 'profile-8',  name: 'Antoine', age: 33, city: 'Djibouti',    bio: 'Architecte le jour, photographe la nuit. Je cherche quelqu\'un qui voit la beauté partout 📷',      tags: ['Photo','Architecture','Art','Cinéma'],        initials: 'AT', color: 'from-red-400 to-pink-500',     compatibility: 70 },
      { _id: 'profile-9',  name: 'Yasmine', age: 23, city: 'Djibouti',    bio: 'Danseuse professionnelle. La vie est une danse, trouvons le rythme ensemble 💃',                     tags: ['Danse','Musique','Voyage','Mode'],            initials: 'YS', color: 'from-pink-500 to-rose-400',    compatibility: 94 },
      { _id: 'profile-10', name: 'Romain',  age: 27, city: 'Djibouti',    bio: 'Entrepreneur passionné par l\'avenir de notre planète 🌱',                                           tags: ['Écologie','Sport','Tech','Cuisine'],          initials: 'RM', color: 'from-emerald-400 to-green-500', compatibility: 76 },
    ];
    await Profile.insertMany(SEED);
    console.log('✅ 10 profils de départ créés');
  }
}

// ─── DB CONNECTION MIDDLEWARE (serverless cache) ───────────────────────────────

let _dbPromise = null;
function connectOnce() {
  if (!_dbPromise) {
    _dbPromise = mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).then(async () => {
      console.log('✅ MongoDB connecté');
      await initData();
    }).catch(err => {
      _dbPromise = null;
      throw err;
    });
  }
  return _dbPromise;
}

app.use(async (req, res, next) => {
  try { await connectOnce(); next(); }
  catch (e) { res.status(503).json({ error: 'Base de données indisponible' }); }
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  body('name').trim().isLength({ min: 2, max: 50 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides : email valide, mot de passe min 8 car. avec 1 majuscule et 1 chiffre, prénom 2–50 car.',
      });
    }

    const { email, password, name } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const userId = uuidv4();
    const user = await User.create({
      _id: userId,
      email,
      password: bcrypt.hashSync(password, 12),
      name: sanitize(name, 50),
      age: 25,
      city: 'Djibouti',
      bio: '',
      tags: [],
    });

    await Profile.create({
      _id: userId,
      name: user.name,
      age: 25,
      city: 'Djibouti',
      bio: '',
      tags: [],
      initials: user.name.slice(0, 2).toUpperCase(),
      color: 'from-violet-400 to-fuchsia-500',
      compatibility: Math.floor(Math.random() * 30) + 65,
    });

    const token = jwt.sign({ userId, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user.toObject();
    res.status(201).json({ token, user: safeUser });
  }
);

app.post('/api/auth/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Email ou mot de passe manquant' });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: 'Compte suspendu. Contactez l\'administrateur.' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user.toObject();
    res.json({ token, user: safeUser });
  }
);

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  const { password, ...safeUser } = user.toObject();
  res.json(safeUser);
});

// ─── PROFILES ─────────────────────────────────────────────────────────────────

app.get('/api/profiles', auth, async (req, res) => {
  const swiped = await Swipe.find({ userId: req.user.userId }).select('profileId');
  const swipedIds = swiped.map(s => s.profileId);
  swipedIds.push(req.user.userId);
  const profiles = await Profile.find({ _id: { $nin: swipedIds } });
  res.json(profiles);
});

app.post('/api/profiles/swipe', auth,
  body('profileId').notEmpty().trim(),
  body('action').isIn(['like', 'pass', 'superlike']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides' });

    const { profileId, action } = req.body;
    try {
      await Swipe.create({ userId: req.user.userId, profileId, action });
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'Déjà swipé' });
      throw e;
    }

    let isMatch = false;
    if (action === 'like' || action === 'superlike') {
      isMatch = Math.random() < 0.4;
      if (isMatch) {
        await Match.create({ _id: uuidv4(), userId: req.user.userId, profileId, superliked: action === 'superlike' });
        const convId = [req.user.userId, profileId].sort().join('_');
        const existing = await Message.findOne({ convId });
        if (!existing) {
          await Message.create({ _id: uuidv4(), convId, from: profileId, text: 'Salut ! Ravi(e) qu\'on soit en match 😊' });
        }
      }
    }

    res.json({ isMatch });
  }
);

// ─── MATCHES ──────────────────────────────────────────────────────────────────

app.get('/api/matches', auth, async (req, res) => {
  const matches = await Match.find({ userId: req.user.userId });
  const profileIds = matches.map(m => m.profileId);
  const profiles = await Profile.find({ _id: { $in: profileIds } });
  const profileMap = Object.fromEntries(profiles.map(p => [p._id, p.toObject()]));
  res.json(
    matches
      .map(m => ({ ...m.toObject(), profile: profileMap[m.profileId] || null }))
      .filter(m => m.profile)
  );
});

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

app.get('/api/messages/:profileId', auth, async (req, res) => {
  const convId = [req.user.userId, req.params.profileId].sort().join('_');
  const msgs = await Message.find({ convId }).sort({ date: 1 });
  res.json(msgs);
});

app.post('/api/messages/:profileId', auth,
  body('text').trim().isLength({ min: 1, max: 1000 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Message invalide' });

    const isMatch = await Match.findOne({ userId: req.user.userId, profileId: req.params.profileId });
    if (!isMatch) return res.status(403).json({ error: 'Pas de match avec cet utilisateur' });

    const convId = [req.user.userId, req.params.profileId].sort().join('_');
    const msg = await Message.create({
      _id: uuidv4(),
      convId,
      from: req.user.userId,
      text: sanitize(req.body.text, 1000),
    });
    res.status(201).json(msg);
  }
);

// ─── USER-TO-USER DISCOVERY ───────────────────────────────────────────────────

app.get('/api/users/discover', auth, async (req, res) => {
  const swiped = await UserSwipe.find({ fromUserId: req.user.userId }).distinct('toUserId');
  const matched1 = await UserMatch.find({ user1Id: req.user.userId }).distinct('user2Id');
  const matched2 = await UserMatch.find({ user2Id: req.user.userId }).distinct('user1Id');
  const excluded = [...new Set([...swiped, ...matched1, ...matched2, req.user.userId])];
  const users = await User.find({ _id: { $nin: excluded }, isBanned: false, isAdmin: false })
    .select('_id name age city bio tags photo').limit(20);
  res.json(users.map(u => ({
    id: u._id, name: u.name, age: u.age, city: u.city,
    bio: u.bio, tags: u.tags, photo: u.photo,
    initials: u.name.slice(0, 2).toUpperCase(),
    color: 'from-[#0089CF] to-[#12AD2B]',
    compatibility: Math.floor(Math.random() * 35) + 60,
    isUser: true,
  })));
});

app.post('/api/users/swipe/:targetId', auth,
  body('action').isIn(['like', 'pass', 'superlike']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Action invalide' });
    const { targetId } = req.params;
    const { action } = req.body;
    if (targetId === req.user.userId) return res.status(400).json({ error: 'Impossible de se swiper soi-même' });
    try {
      await UserSwipe.create({ fromUserId: req.user.userId, toUserId: targetId, action });
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'Déjà swipé' });
      throw e;
    }
    let isMatch = false;
    if (action === 'like' || action === 'superlike') {
      const mutual = await UserSwipe.findOne({ fromUserId: targetId, toUserId: req.user.userId, action: { $in: ['like', 'superlike'] } });
      if (mutual) {
        isMatch = true;
        const existing = await UserMatch.findOne({
          $or: [{ user1Id: req.user.userId, user2Id: targetId }, { user1Id: targetId, user2Id: req.user.userId }],
        });
        if (!existing) {
          const matchId = uuidv4();
          await UserMatch.create({ _id: matchId, user1Id: req.user.userId, user2Id: targetId });
          const convId = [req.user.userId, targetId].sort().join('__');
          await Message.create({ _id: uuidv4(), convId, from: targetId, text: 'Salut ! On est en match 🎉' });
        }
      }
    }
    res.json({ isMatch });
  }
);

app.get('/api/users/matches', auth, async (req, res) => {
  const matches = await UserMatch.find({
    $or: [{ user1Id: req.user.userId }, { user2Id: req.user.userId }],
  });
  const otherIds = matches.map(m => m.user1Id === req.user.userId ? m.user2Id : m.user1Id);
  const users = await User.find({ _id: { $in: otherIds } }).select('_id name age city bio tags photo');
  const userMap = Object.fromEntries(users.map(u => [u._id, u]));
  res.json(matches.map(m => {
    const otherId = m.user1Id === req.user.userId ? m.user2Id : m.user1Id;
    const u = userMap[otherId];
    if (!u) return null;
    return {
      id: m._id, matchUserId: otherId,
      name: u.name, age: u.age, city: u.city, photo: u.photo,
      initials: u.name.slice(0, 2).toUpperCase(),
      color: 'from-[#0089CF] to-[#12AD2B]',
      date: m.date,
    };
  }).filter(Boolean));
});

app.get('/api/users/messages/:matchUserId', auth, async (req, res) => {
  const convId = [req.user.userId, req.params.matchUserId].sort().join('__');
  const msgs = await Message.find({ convId }).sort({ date: 1 });
  res.json(msgs);
});

app.post('/api/users/messages/:matchUserId', auth,
  body('text').trim().isLength({ min: 1, max: 1000 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Message invalide' });
    const { matchUserId } = req.params;
    const isMatch = await UserMatch.findOne({
      $or: [{ user1Id: req.user.userId, user2Id: matchUserId }, { user1Id: matchUserId, user2Id: req.user.userId }],
    });
    if (!isMatch) return res.status(403).json({ error: 'Pas de match avec cet utilisateur' });
    const convId = [req.user.userId, matchUserId].sort().join('__');
    const msg = await Message.create({ _id: uuidv4(), convId, from: req.user.userId, text: sanitize(req.body.text, 1000) });
    res.status(201).json(msg);
  }
);

// ─── PROFILE UPDATE ───────────────────────────────────────────────────────────

app.put('/api/profile', auth,
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('age').optional().isInt({ min: 18, max: 100 }),
  body('city').optional().trim().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const { name, age, city, bio, tags } = req.body;
    if (name !== undefined) user.name = sanitize(name, 50);
    if (age  !== undefined) user.age  = Math.min(100, Math.max(18, parseInt(age)));
    if (city !== undefined) user.city = sanitize(city, 100);
    if (bio  !== undefined) user.bio  = sanitize(bio, 500);
    if (Array.isArray(tags)) user.tags = tags.slice(0, 10).map(t => sanitize(String(t), 30));
    await user.save();

    await Profile.findByIdAndUpdate(user._id, {
      name: user.name,
      age: user.age,
      city: user.city,
      bio: user.bio,
      tags: user.tags,
      initials: user.name.slice(0, 2).toUpperCase(),
    });

    const { password, ...safeUser } = user.toObject();
    res.json(safeUser);
  }
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  const [totalUsers, totalMatches, totalMessages, totalSwipes] = await Promise.all([
    User.countDocuments(),
    Match.countDocuments(),
    Message.countDocuments(),
    Swipe.countDocuments(),
  ]);
  res.json({ totalUsers, totalMatches, totalMessages, totalSwipes });
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

app.put('/api/admin/users/:id', adminAuth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  const { name, age, city, bio, isAdmin, isBanned } = req.body;
  if (name    !== undefined) user.name    = sanitize(name, 50);
  if (age     !== undefined) user.age     = parseInt(age);
  if (city    !== undefined) user.city    = sanitize(city, 100);
  if (bio     !== undefined) user.bio     = sanitize(bio, 500);
  if (isAdmin  !== undefined) user.isAdmin  = Boolean(isAdmin);
  if (isBanned !== undefined) user.isBanned = Boolean(isBanned);
  await user.save();
  const { password, ...safe } = user.toObject();
  res.json(safe);
});

app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  if (user.isAdmin) return res.status(403).json({ error: 'Impossible de supprimer un admin' });
  await User.deleteOne({ _id: req.params.id });
  await Profile.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

app.get('/api/admin/profiles', adminAuth, async (req, res) => {
  res.json(await Profile.find());
});

app.post('/api/admin/profiles', adminAuth,
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('age').isInt({ min: 18, max: 100 }),
  body('city').trim().isLength({ max: 100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides' });
    const { name, age, city, bio, tags, color, compatibility, photo } = req.body;
    const COLORS = [
      'from-pink-400 to-purple-500', 'from-blue-400 to-cyan-500',
      'from-orange-400 to-red-500',  'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500','from-purple-400 to-pink-500',
      'from-indigo-400 to-blue-500', 'from-red-400 to-pink-500',
      'from-emerald-400 to-green-500',
    ];
    const p = await Profile.create({
      _id: `profile-${uuidv4().slice(0, 8)}`,
      name: sanitize(name, 50),
      age: parseInt(age),
      city: sanitize(city, 100),
      bio: sanitize(bio || '', 500),
      tags: Array.isArray(tags) ? tags.slice(0, 10).map(t => sanitize(t, 30)) : [],
      initials: name.slice(0, 2).toUpperCase(),
      color: color || COLORS[Math.floor(Math.random() * COLORS.length)],
      compatibility: compatibility
        ? Math.min(100, Math.max(0, parseInt(compatibility)))
        : Math.floor(Math.random() * 35) + 60,
      photo: photo || '',
    });
    res.status(201).json(p);
  }
);

app.put('/api/admin/profiles/:id', adminAuth, async (req, res) => {
  const p = await Profile.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Profil non trouvé' });
  const { name, age, city, bio, tags, color, compatibility, photo } = req.body;
  if (name  !== undefined) { p.name = sanitize(name, 50); p.initials = name.slice(0, 2).toUpperCase(); }
  if (age   !== undefined) p.age           = parseInt(age);
  if (city  !== undefined) p.city          = sanitize(city, 100);
  if (bio   !== undefined) p.bio           = sanitize(bio, 500);
  if (Array.isArray(tags)) p.tags          = tags.slice(0, 10).map(t => sanitize(t, 30));
  if (color !== undefined) p.color         = color;
  if (compatibility !== undefined) p.compatibility = Math.min(100, Math.max(0, parseInt(compatibility)));
  if (photo !== undefined) p.photo         = photo;
  await p.save();
  res.json(p);
});

app.delete('/api/admin/profiles/:id', adminAuth, async (req, res) => {
  const p = await Profile.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Profil non trouvé' });
  await Profile.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

app.get('/api/admin/matches', adminAuth, async (req, res) => {
  const matches = await Match.find();
  const userIds    = [...new Set(matches.map(m => m.userId))];
  const profileIds = [...new Set(matches.map(m => m.profileId))];
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('name'),
    Profile.find({ _id: { $in: profileIds } }).select('name'),
  ]);
  const userMap    = Object.fromEntries(users.map(u => [u._id, u.name]));
  const profileMap = Object.fromEntries(profiles.map(p => [p._id, p.name]));
  res.json(matches.map(m => ({
    ...m.toObject(),
    userName:    userMap[m.userId]       || 'Inconnu',
    profileName: profileMap[m.profileId] || 'Inconnu',
  })));
});

app.get('/api/admin/messages', adminAuth, async (req, res) => {
  const msgs = await Message.aggregate([
    { $sort: { date: 1 } },
    { $group: { _id: '$convId', count: { $sum: 1 }, last: { $last: '$text' } } },
  ]);
  res.json(msgs.map(m => ({ convId: m._id, count: m.count, last: m.last })));
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ─── START ────────────────────────────────────────────────────────────────────

if (!process.env.VERCEL) {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('✅ MongoDB connecté');
      await initData();
      app.listen(PORT, () => {
        console.log(`\n🔥 Serveur Djibouti-Rencontre démarré sur http://localhost:${PORT}`);
        console.log('🔒 Sécurité : MongoDB + JWT + bcrypt + Helmet + Rate Limiting\n');
      });
    })
    .catch(err => {
      console.error('❌ Erreur de connexion MongoDB :', err.message);
      process.exit(1);
    });
}

module.exports = app;
