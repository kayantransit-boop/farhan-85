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

const MONGODB_URI = (process.env.MONGODB_URI || '').replace(/[^\x20-\x7E]/g, '').trim();
if (!MONGODB_URI) { console.error('FATAL: MONGODB_URI manquant dans .env'); process.exit(1); }
console.log('🔍 MongoDB URI (masqué):', MONGODB_URI.replace(/:([^@]+)@/, ':***@'));

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
  photos: { type: [String], default: [] },
  lastSeen: { type: Date, default: null },
  emailVerified: { type: Boolean, default: false },
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  _id: String,
  convId: { type: String, required: true, index: true },
  from: String,
  text: String,
  readBy: { type: [String], default: [] },
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

const reportSchema = new mongoose.Schema({
  _id: String,
  reporterId: { type: String, required: true },
  reportedId: { type: String, required: true },
  reason: { type: String, default: '' },
  date: { type: Date, default: Date.now },
});

const blockSchema = new mongoose.Schema({
  blockerId: { type: String, required: true },
  blockedId: { type: String, required: true },
  date: { type: Date, default: Date.now },
});
blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

const passwordResetSchema = new mongoose.Schema({
  _id: String,
  userId: { type: String, required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

const User          = mongoose.model('User',          userSchema);
const Message       = mongoose.model('Message',       messageSchema);
const UserSwipe     = mongoose.model('UserSwipe',     userSwipeSchema);
const UserMatch     = mongoose.model('UserMatch',     userMatchSchema);
const Report        = mongoose.model('Report',        reportSchema);
const Block         = mongoose.model('Block',         blockSchema);
const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL.split(',').map(u => u.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

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

app.get('/api/ping', (req, res) => res.json({ ok: true }));

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function sanitize(str, max = 500) {
  return String(str || '').replace(/[<>"'`]/g, '').trim().slice(0, max);
}

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
  const user = await User.findById(req.user.userId).select('isBanned');
  if (!user || user.isBanned) {
    return res.status(403).json({ error: 'Compte suspendu. Contactez l\'administrateur.' });
  }
  next();
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
      password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || require('crypto').randomBytes(24).toString('hex'), 12),
      name: 'Administrateur',
      age: 30,
      city: 'Djibouti',
      bio: 'Compte administrateur',
      tags: [],
      isAdmin: true,
    });
    console.log('\n👑 Compte admin créé : admin@djibouti-rencontre.dj');
  }

}

// ─── DB CONNECTION MIDDLEWARE (serverless cache) ───────────────────────────────

let _dbPromise = null;
function connectOnce() {
  if (!_dbPromise) {
    _dbPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      family: 4,
    }).then(async () => {
      console.log('✅ MongoDB connecté');
      await initData();
    }).catch(err => {
      console.error('❌ MongoDB erreur:', err.message);
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
  authLimiter,
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

    const { email, password, name, photo } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const userId = uuidv4();
    const safePhoto = (photo && photo.startsWith('data:image/')) ? photo : '';
    const user = await User.create({
      _id: userId,
      email,
      password: bcrypt.hashSync(password, 12),
      name: sanitize(name, 50),
      age: 25,
      city: 'Djibouti',
      bio: '',
      tags: [],
      photo: safePhoto,
    });

    const token = jwt.sign({ userId, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user.toObject();
    res.status(201).json({ token, user: { ...safeUser, id: userId } });
  }
);

app.post('/api/auth/login',
  authLimiter,
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
    res.json({ token, user: { ...safeUser, id: user._id } });
  }
);

app.post('/api/auth/forgot-password',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Email invalide' });
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true }); // Ne pas révéler si l'email existe
    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await PasswordReset.deleteMany({ userId: user._id });
    await PasswordReset.create({ _id: uuidv4(), userId: user._id, token, expires });
    res.json({ success: true });
  }
);

app.post('/api/auth/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Token ou mot de passe invalide' });
    const { token, password } = req.body;
    const reset = await PasswordReset.findOne({ token, used: false, expires: { $gt: new Date() } });
    if (!reset) return res.status(400).json({ error: 'Lien expiré ou invalide' });
    await User.updateOne({ _id: reset.userId }, { password: bcrypt.hashSync(password, 12) });
    await PasswordReset.updateOne({ _id: reset._id }, { used: true });
    res.json({ success: true });
  }
);

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  const { password, ...safeUser } = user.toObject();
  res.json({ ...safeUser, id: user._id });
});

// ─── ONLINE STATUS ────────────────────────────────────────────────────────────

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen).getTime()) < 2 * 60 * 1000;
}

app.post('/api/users/heartbeat', auth, async (req, res) => {
  await User.updateOne({ _id: req.user.userId }, { lastSeen: new Date() });
  res.json({ ok: true });
});

app.get('/api/users/status/:userId', auth, async (req, res) => {
  const u = await User.findById(req.params.userId).select('lastSeen');
  res.json({ online: u ? isOnline(u.lastSeen) : false });
});

app.get('/api/users/online', auth, async (req, res) => {
  const [blockedByMe, blockedMe] = await Promise.all([
    Block.find({ blockerId: req.user.userId }).distinct('blockedId'),
    Block.find({ blockedId: req.user.userId }).distinct('blockerId'),
  ]);
  const excluded = [...new Set([...blockedByMe, ...blockedMe, req.user.userId])];
  const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
  const users = await User.find({
    _id: { $nin: excluded },
    lastSeen: { $gte: twoMinsAgo },
    isBanned: false,
    isAdmin: false,
  }).select('_id name age city photo lastSeen').limit(50);
  res.json(users.map(u => ({
    id: u._id, name: u.name, age: u.age, city: u.city,
    photo: u.photo,
    initials: u.name.slice(0, 2).toUpperCase(),
    color: 'from-[#0089CF] to-[#12AD2B]',
    online: true,
  })));
});

// ─── USER-TO-USER DISCOVERY ───────────────────────────────────────────────────

app.get('/api/users/discover', auth, async (req, res) => {
  const { minAge, maxAge, city } = req.query;
  const [swiped, matched1, matched2, blockedByMe, blockedMe] = await Promise.all([
    UserSwipe.find({ fromUserId: req.user.userId }).distinct('toUserId'),
    UserMatch.find({ user1Id: req.user.userId }).distinct('user2Id'),
    UserMatch.find({ user2Id: req.user.userId }).distinct('user1Id'),
    Block.find({ blockerId: req.user.userId }).distinct('blockedId'),
    Block.find({ blockedId: req.user.userId }).distinct('blockerId'),
  ]);
  const excluded = [...new Set([...swiped, ...matched1, ...matched2, ...blockedByMe, ...blockedMe, req.user.userId])];
  const filter = { _id: { $nin: excluded }, isBanned: false, isAdmin: false };
  if (minAge || maxAge) {
    filter.age = {};
    if (minAge) filter.age.$gte = parseInt(minAge);
    if (maxAge) filter.age.$lte = parseInt(maxAge);
  }
  if (city && city.trim()) filter.city = new RegExp(city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await User.find(filter).select('_id name age city bio tags photo photos lastSeen').limit(20);
  res.json(users.map(u => ({
    id: u._id, name: u.name, age: u.age, city: u.city,
    bio: u.bio, tags: u.tags, photo: u.photo, photos: u.photos || [],
    initials: u.name.slice(0, 2).toUpperCase(),
    color: 'from-[#0089CF] to-[#12AD2B]',
    compatibility: Math.floor(Math.random() * 35) + 60,
    isUser: true, online: isOnline(u.lastSeen),
  })));
});

app.get('/api/users/swipe-remaining', auth, async (req, res) => {
  const DAILY_LIMIT = 50;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const used = await UserSwipe.countDocuments({ fromUserId: req.user.userId, date: { $gte: today } });
  res.json({ remaining: Math.max(0, DAILY_LIMIT - used), limit: DAILY_LIMIT, used });
});

app.post('/api/users/report/:reportedId', auth,
  body('reason').optional().trim().isLength({ max: 200 }),
  async (req, res) => {
    const { reportedId } = req.params;
    if (reportedId === req.user.userId) return res.status(400).json({ error: 'Impossible de vous signaler vous-même' });
    const alreadyReported = await Report.findOne({ reporterId: req.user.userId, reportedId });
    if (alreadyReported) return res.json({ success: true });
    await Report.create({ _id: uuidv4(), reporterId: req.user.userId, reportedId, reason: sanitize(req.body.reason || '', 200) });
    res.json({ success: true });
  }
);

app.post('/api/users/block/:blockedId', auth, async (req, res) => {
  const { blockedId } = req.params;
  if (blockedId === req.user.userId) return res.status(400).json({ error: 'Impossible de vous bloquer vous-même' });
  try {
    await Block.create({ blockerId: req.user.userId, blockedId });
  } catch (e) {
    if (e.code === 11000) return res.json({ success: true });
    throw e;
  }
  res.json({ success: true });
});

app.delete('/api/users/block/:blockedId', auth, async (req, res) => {
  await Block.deleteOne({ blockerId: req.user.userId, blockedId: req.params.blockedId });
  res.json({ success: true });
});

app.get('/api/users/blocked', auth, async (req, res) => {
  const blocks = await Block.find({ blockerId: req.user.userId });
  const ids = blocks.map(b => b.blockedId);
  const users = await User.find({ _id: { $in: ids } }).select('_id name photo');
  res.json(users.map(u => ({ id: u._id, name: u.name, photo: u.photo })));
});

app.post('/api/users/swipe/:targetId', auth,
  body('action').isIn(['like', 'pass', 'superlike']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Action invalide' });
    const { targetId } = req.params;
    const { action } = req.body;
    if (targetId === req.user.userId) return res.status(400).json({ error: 'Impossible de se swiper soi-même' });
    const DAILY_LIMIT = 50;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dailyCount = await UserSwipe.countDocuments({ fromUserId: req.user.userId, date: { $gte: today } });
    if (dailyCount >= DAILY_LIMIT) return res.status(429).json({ error: `Limite de ${DAILY_LIMIT} swipes atteinte pour aujourd'hui`, remaining: 0 });
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
  const users = await User.find({ _id: { $in: otherIds } }).select('_id name age city bio tags photo lastSeen');
  const userMap = Object.fromEntries(users.map(u => [u._id, u]));
  res.json(matches.map(m => {
    const otherId = m.user1Id === req.user.userId ? m.user2Id : m.user1Id;
    const u = userMap[otherId];
    if (!u) return null;
    return {
      id: m._id, matchUserId: otherId,
      name: u.name, age: u.age, city: u.city, bio: u.bio || '', tags: u.tags || [], photo: u.photo,
      initials: u.name.slice(0, 2).toUpperCase(),
      color: 'from-[#0089CF] to-[#12AD2B]',
      online: isOnline(u.lastSeen),
      date: m.date,
    };
  }).filter(Boolean));
});

app.get('/api/users/messages/:matchUserId', auth, async (req, res) => {
  const convId = [req.user.userId, req.params.matchUserId].sort().join('__');
  const msgs = await Message.find({ convId }).sort({ date: 1 });
  res.json(msgs);
});

app.post('/api/users/messages/:matchUserId/read', auth, async (req, res) => {
  const convId = [req.user.userId, req.params.matchUserId].sort().join('__');
  await Message.updateMany(
    { convId, from: { $ne: req.user.userId }, readBy: { $ne: req.user.userId } },
    { $addToSet: { readBy: req.user.userId } }
  );
  res.json({ ok: true });
});

app.post('/api/users/messages/:matchUserId', auth,
  body('text').trim().isLength({ min: 1, max: 1000 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Message invalide' });
    const { matchUserId } = req.params;
    const [isMatch, targetUser] = await Promise.all([
      UserMatch.findOne({
        $or: [{ user1Id: req.user.userId, user2Id: matchUserId }, { user1Id: matchUserId, user2Id: req.user.userId }],
      }),
      User.findById(matchUserId).select('lastSeen'),
    ]);
    const targetOnline = targetUser && isOnline(targetUser.lastSeen);
    if (!isMatch && !targetOnline) return res.status(403).json({ error: 'Pas de match avec cet utilisateur' });
    // Auto-créer le match si l'utilisateur cible est en ligne
    if (!isMatch && targetOnline) {
      await UserMatch.create({ _id: uuidv4(), user1Id: req.user.userId, user2Id: matchUserId });
    }
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

    const { name, age, city, bio, tags, photo, photos } = req.body;
    if (name !== undefined) user.name = sanitize(name, 50);
    if (age  !== undefined) user.age  = Math.min(100, Math.max(18, parseInt(age)));
    if (city !== undefined) user.city = sanitize(city, 100);
    if (bio  !== undefined) user.bio  = sanitize(bio, 500);
    if (Array.isArray(tags)) user.tags = tags.slice(0, 10).map(t => sanitize(String(t), 30));
    if (photo !== undefined && typeof photo === 'string' && photo.startsWith('data:image/')) user.photo = photo;
    if (photo === '') user.photo = '';
    if (Array.isArray(photos)) user.photos = photos.slice(0, 5).filter(p => typeof p === 'string' && p.startsWith('data:image/'));
    await user.save();

    const { password, ...safeUser } = user.toObject();
    res.json(safeUser);
  }
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────

app.put('/api/admin/change-password',
  adminAuth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Nouveau mot de passe invalide : min 8 car., 1 majuscule, 1 chiffre' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    if (!bcrypt.compareSync(req.body.currentPassword, user.password)) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    await User.updateOne({ _id: user._id }, { password: bcrypt.hashSync(req.body.newPassword, 12) });
    res.json({ success: true });
  }
);

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  const [totalUsers, totalMatches, totalMessages, totalSwipes] = await Promise.all([
    User.countDocuments(),
    UserMatch.countDocuments(),
    Message.countDocuments(),
    UserSwipe.countDocuments(),
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
  res.json({ success: true });
});

// Crée un match entre deux utilisateurs (admin seulement)
app.post('/api/admin/force-match', adminAuth, async (req, res) => {
  const { user1Id, user2Id } = req.body;
  if (!user1Id || !user2Id) return res.status(400).json({ error: 'user1Id et user2Id requis' });
  const [u1, u2] = await Promise.all([User.findById(user1Id), User.findById(user2Id)]);
  if (!u1 || !u2) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  // Créer les swipes mutuels (ignorer si déjà existants)
  await UserSwipe.updateOne({ fromUserId: user1Id, toUserId: user2Id }, { fromUserId: user1Id, toUserId: user2Id, action: 'like' }, { upsert: true });
  await UserSwipe.updateOne({ fromUserId: user2Id, toUserId: user1Id }, { fromUserId: user2Id, toUserId: user1Id, action: 'like' }, { upsert: true });
  // Créer le match si pas déjà existant
  const existing = await UserMatch.findOne({ $or: [{ user1Id, user2Id }, { user1Id: user2Id, user2Id: user1Id }] });
  if (!existing) {
    const matchId = uuidv4();
    await UserMatch.create({ _id: matchId, user1Id, user2Id });
    const convId = [user1Id, user2Id].sort().join('__');
    await Message.create({ _id: uuidv4(), convId, from: user2Id, text: 'Salut ! On est en match 🎉' });
  }
  // Générer des tokens pour les deux (pour le test)
  const tokenA = jwt.sign({ userId: u1._id, email: u1.email }, JWT_SECRET, { expiresIn: '2h' });
  const tokenB = jwt.sign({ userId: u2._id, email: u2.email }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ success: true, matchCreated: !existing, tokenA, tokenB, nameA: u1.name, nameB: u2.name });
});

app.get('/api/admin/matches', adminAuth, async (req, res) => {
  const matches = await UserMatch.find().sort({ date: -1 }).limit(200);
  const ids = [...new Set([...matches.map(m => m.user1Id), ...matches.map(m => m.user2Id)])];
  const users = await User.find({ _id: { $in: ids } }).select('name');
  const userMap = Object.fromEntries(users.map(u => [u._id, u.name]));
  res.json(matches.map(m => ({
    ...m.toObject(),
    userName:    userMap[m.user1Id] || 'Inconnu',
    profileName: userMap[m.user2Id] || 'Inconnu',
  })));
});

app.get('/api/admin/messages', adminAuth, async (req, res) => {
  const msgs = await Message.aggregate([
    { $sort: { date: 1 } },
    { $group: { _id: '$convId', count: { $sum: 1 }, last: { $last: '$text' } } },
  ]);
  res.json(msgs.map(m => ({ convId: m._id, count: m.count, last: m.last })));
});

app.get('/api/admin/reports', adminAuth, async (req, res) => {
  const reports = await Report.find().sort({ date: -1 }).limit(100);
  const ids = [...new Set([...reports.map(r => r.reporterId), ...reports.map(r => r.reportedId)])];
  const users = await User.find({ _id: { $in: ids } }).select('name');
  const userMap = Object.fromEntries(users.map(u => [u._id, u.name]));
  res.json(reports.map(r => ({ ...r.toObject(), reporterName: userMap[r.reporterId] || '?', reportedName: userMap[r.reportedId] || '?' })));
});

// ─── STATS PUBLIQUES ──────────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
  const [totalUsers, totalMatches, onlineNow] = await Promise.all([
    User.countDocuments({ isBanned: false, isAdmin: false }),
    UserMatch.countDocuments(),
    User.countDocuments({ isBanned: false, isAdmin: false, lastSeen: { $gte: twoMinsAgo } }),
  ]);
  res.json({ totalUsers, totalMatches, onlineNow });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🔥 Serveur Djibouti-Rencontre démarré sur http://localhost:${PORT}`);
  console.log('🔒 Sécurité : MongoDB + JWT + bcrypt + Helmet + Rate Limiting\n');
});

module.exports = app;
