// server.js — Express + EJS + Mongoose + express-ejs-layouts + Secure Auth (Signup/Login)

const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://s1382229_db_user:Zxcvbnm24354657@cluster0.m4nihdo.mongodb.net/?appName=Cluster0",
  DB_NAME: process.env.DB_NAME || "bookapp",
  SESSION_SECRET: process.env.SESSION_SECRET || "change_this_secret",
  PORT: process.env.PORT || 8099,
  SESSION_SECURE: process.env.SESSION_SECURE === 'true'
};

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const bcrypt = require('bcrypt');

const User = require('./models/user');
const Book = require('./models/book');
const apiRouter = require('./routes/api');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Core middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'loginSession',
  keys: [CONFIG.SESSION_SECRET],
  httpOnly: true,
  sameSite: 'lax',
  secure: !!CONFIG.SESSION_SECURE,
  maxAge: 24 * 60 * 60 * 1000
}));

// Make username available to views
app.use((req, res, next) => {
  if (req.session && req.session.userId && req.session.username) {
    res.locals.username = req.session.username;
  } else {
    res.locals.username = null;
  }
  next();
});

function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
}
function requireApiAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

// Optional lightweight request/session debug
app.use((req, res, next) => {
  // console.log('DBG', req.method, req.path, { userId: req.session?.userId || null });
  next();
});

// Mongo connection + seed
(async () => {
  try {
    const uri = CONFIG.MONGODB_URI;
    const dbName = CONFIG.DB_NAME;
    if (!uri) throw new Error('Missing CONFIG.MONGODB_URI');

    await mongoose.connect(uri, { dbName });
    console.log('Mongoose connected to', dbName);

    // Seed a demo user if not exists
    const existing = await User.findOne({ username: 'guest' });
    if (!existing) {
      const passwordHash = await bcrypt.hash('guest', 12);
      await User.create({ username: 'guest', passwordHash });
      console.log('Seeded demo user: guest / guest');
    }
  } catch (err) {
    console.error('Mongo connection error:', err);
    process.exit(1);
  }
})();

// Routes

// Home
app.get('/', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/books');
  res.render('index', { title: 'Home' });
});

// Auth pages
app.get('/signup', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/books');
  res.render('auth/signup', { title: 'Sign up', error: null, name: '' });
});

app.post('/signup', async (req, res) => {
  try {
    // Accept either 'username' (preferred) or legacy 'name' field
    const raw = (req.body?.username ?? req.body?.name ?? '');
    const password = req.body?.password ?? '';
    const trimmed = raw.trim().normalize('NFKC');

    // Validate
    if (!trimmed || trimmed.length < 2) {
      return res.status(400).render('auth/signup', {
        title: 'Sign up',
        error: 'Username must be at least 2 characters.',
        name: trimmed
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).render('auth/signup', {
        title: 'Sign up',
        error: 'Password must be at least 6 characters.',
        name: trimmed
      });
    }

    // Create user (unique index on username enforces uniqueness)
    const passwordHash = await bcrypt.hash(password, 12);
    let user;
    try {
      user = await User.create({ username: trimmed, passwordHash });
    } catch (err) {
      // Duplicate key from Mongo
      if (err && (err.code === 11000 || err.code === 11001)) {
        console.error('Signup duplicate key:', {
          message: err.message,
          keyValue: err.keyValue,
          code: err.code
        });
        return res.status(409).render('auth/signup', {
          title: 'Sign up',
          error: 'Username is already taken.',
          name: trimmed
        });
      }
      // Validation error
      if (err && err.name === 'ValidationError') {
        return res.status(400).render('auth/signup', {
          title: 'Sign up',
          error: Object.values(err.errors).map(e => e.message).join('; '),
          name: trimmed
        });
      }
      console.error('Signup DB error:', err);
      return res.status(500).render('auth/signup', {
        title: 'Sign up',
        error: 'Server error while creating user.',
        name: trimmed
      });
    }

    // Start session
    req.session.userId = user._id.toString();
    req.session.username = user.username;

    res.redirect('/books');
  } catch (err) {
    console.error('Signup error (outer):', err);
    res.status(500).render('auth/signup', {
      title: 'Sign up',
      error: 'Something went wrong. Please try again.',
      name: (req.body?.username ?? req.body?.name ?? '')
    });
  }
});

app.get('/login', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/books');
  res.render('auth/login', { title: 'Login', error: null, name: '' });
});

// Hardened login route
app.post('/login', async (req, res) => {
  // Accept either 'username' or legacy 'name' from the form
  const raw = (req.body?.username ?? req.body?.name ?? '');
  const password = req.body?.password ?? '';
  const username = raw.trim().normalize('NFKC');

  // Basic input validation
  if (!username || username.length < 2) {
    return res.status(400).render('auth/login', { title: 'Login', error: 'Enter a valid username.', name: username });
  }
  if (!password) {
    return res.status(400).render('auth/login', { title: 'Login', error: 'Password is required.', name: username });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).render('auth/login', { title: 'Login', error: 'Invalid username or password.', name: username });
    }

    if (!user.passwordHash) {
      console.error('Login error: user has no passwordHash', { id: user._id.toString(), username: user.username });
      return res.status(500).render('auth/login', { title: 'Login', error: 'Account is misconfigured. Please contact support.', name: username });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).render('auth/login', { title: 'Login', error: 'Invalid username or password.', name: username });
    }

    req.session.userId = user._id.toString();
    req.session.username = user.username;
    return res.redirect('/books');
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).render('auth/login', { title: 'Login', error: 'Server error', name: username || '' });
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// Books (protected)
app.get('/books', isLoggedIn, async (req, res) => {
  const { q, yearMin, yearMax, tag } = req.query;
  const criteria = { owner: req.session.userId };

  if (q) {
    criteria.$or = [
      { title: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } }
    ];
  }
  if (tag) criteria.tags = tag;
  if (yearMin || yearMax) {
    criteria.year = {};
    if (yearMin) criteria.year.$gte = Number(yearMin);
    if (yearMax) criteria.year.$lte = Number(yearMax);
  }

  const books = await Book.find(criteria).sort({ createdAt: -1 }).limit(200);
  res.render('books/list', {
    title: 'Your Books',
    books,
    q: q || '',
    yearMin: yearMin || '',
    yearMax: yearMax || '',
    tag: tag || ''
  });
});

app.get('/books/new', isLoggedIn, (req, res) => {
  res.render('books/form', {
    title: 'New Book',
    book: null,
    method: 'POST',
    action: '/books',
    submitLabel: 'Create',
    error: null
  });
});

app.post('/books', isLoggedIn, async (req, res) => {
  try {
    const { title, author, year, tags } = req.body;
    if (!title || !author) {
      return res.status(400).render('books/form', {
        title: 'New Book',
        book: null,
        method: 'POST',
        action: '/books',
        submitLabel: 'Create',
        error: 'Title and author are required'
      });
    }
    await Book.create({
      title,
      author,
      year: year ? Number(year) : undefined,
      tags: Array.isArray(tags)
        ? tags
        : (typeof tags === 'string'
            ? tags.split(',').map(t => t.trim()).filter(Boolean)
            : []),
      owner: req.session.userId
    });
    res.redirect('/books');
  } catch (err) {
    console.error('Create (web) error:', err);
    res.status(500).render('books/form', {
      title: 'New Book',
      book: null,
      method: 'POST',
      action: '/books',
      submitLabel: 'Create',
      error: 'Server error'
    });
  }
});

app.get('/books/:id', isLoggedIn, async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, owner: req.session.userId });
  if (!book) return res.status(404).send('Not found');
  res.render('books/detail', { title: book.title, book });
});

app.get('/books/:id/edit', isLoggedIn, async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, owner: req.session.userId });
  if (!book) return res.status(404).send('Not found');
  res.render('books/form', {
    title: `Edit: ${book.title}`,
    book,
    method: 'POST',
    action: `/books/${book._id}?&_method=PUT`,
    submitLabel: 'Update',
    error: null
  });
});

app.put('/books/:id', isLoggedIn, async (req, res) => {
  try {
    const { title, author, year, tags } = req.body;
    await Book.updateOne(
      { _id: req.params.id, owner: req.session.userId },
      {
        $set: {
          title,
          author,
          year: year ? Number(year) : undefined,
          tags: Array.isArray(tags)
            ? tags
            : (typeof tags === 'string'
                ? tags.split(',').map(t => t.trim()).filter(Boolean)
                : [])
        }
      }
    );
    res.redirect('/books');
  } catch (err) {
    console.error('Update (web) error:', err);
    res.status(500).send('Server error');
  }
});

app.delete('/books/:id', isLoggedIn, async (req, res) => {
  try {
    await Book.deleteOne({ _id: req.params.id, owner: req.session.userId });
    res.redirect('/books');
  } catch (err) {
    console.error('Delete (web) error:', err);
    res.status(500).send('Server error');
  }
});

// Public API (no auth)
app.get('/api/books', async (req, res) => {
  const { q, yearMin, yearMax, tag } = req.query;
  const criteria = {};
  if (q) {
    criteria.$or = [
      { title: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } }
    ];
  }
  if (tag) criteria.tags = tag;
  if (yearMin || yearMax) {
    criteria.year = {};
    if (yearMin) criteria.year.$gte = Number(yearMin);
    if (yearMax) criteria.year.$lte = Number(yearMax);
  }
  const results = await Book.find(criteria).limit(50);
  res.json(results);
});

// Open API signup (JSON)
const openApi = express.Router();
openApi.post('/signup', async (req, res) => {
  try {
    const raw = (req.body?.username ?? req.body?.name ?? '');
    const password = req.body?.password ?? '';
    const trimmed = raw.trim().normalize('NFKC');

    if (!trimmed || trimmed.length < 2) return res.status(400).json({ error: 'validation_failed', details: { username: 'min_length_2' } });
    if (!password || password.length < 6) return res.status(400).json({ error: 'validation_failed', details: { password: 'min_length_6' } });

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await User.create({ username: trimmed, passwordHash });
    } catch (err) {
      if (err && (err.code === 11000 || err.code === 11001)) {
        return res.status(409).json({ error: 'conflict', message: 'username_taken', keyValue: err.keyValue || null });
      }
      return res.status(500).json({ error: 'internal_error' });
    }

    req.session.userId = user._id.toString();
    req.session.username = user.username;

    res.status(201).json({ id: user._id, username: user.username });
  } catch (e) {
    console.error('API signup error:', e);
    res.status(500).json({ error: 'internal_error' });
  }
});
app.use('/api', openApi);

// Auth-required API router
app.use('/api', requireApiAuth, apiRouter);

// Health
app.get('/healthz', (req, res) => res.status(200).send('ok'));

// Optional debug endpoints (remove in prod)
app.get('/__debug/session', (req, res) => {
  res.json({
    userId: req.session?.userId || null,
    username: req.session?.username || null,
    keys: Object.keys(req.session || {})
  });
});
app.post('/__debug/clear', (req, res) => {
  req.session = null;
  res.json({ cleared: true });
});

// List users (dev only)
app.get('/__debug/users', async (req, res) => {
  try {
    const users = await User.find({}, { username: 1 }).lean();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_users' });
  }
});

// Show Mongo indexes for users collection (dev only)
app.get('/__debug/user-indexes', async (req, res) => {
  try {
    const indexes = await mongoose.connection.db
      .collection('users')
      .indexes();
    res.json(indexes);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_indexes' });
  }
});

const PORT = Number(CONFIG.PORT) || 8099;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

module.exports = app;
