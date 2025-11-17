const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const User = require('./models/user');
const Book = require('./models/book');

const app = express();

// 1) View engine and static files
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 2) Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // allows PUT/DELETE via forms using ?_method=PUT

// 3) Sessions (cookie-session per Lecture 7)
const SECRETKEY = 'change_this_secret';
app.use(cookieSession({
  name: 'loginSession',
  keys: [SECRETKEY],
  maxAge: 24 * 60 * 60 * 1000
}));

// 4) Auth middleware
function isLoggedIn(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.redirect('/login');
}

// 5) MongoDB connection (Lecture 6)s1382229_db_user:Zxcvbnm24354657
(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://s1382229_db_user:Zxcvbnm24354657@cluster0.m4nihdo.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'bookapp' });
  console.log('Mongoose Connected!');
  // Seed an admin/user if none exist (demo)
  const count = await User.countDocuments();
  if (count === 0) {
    await User.create([
      { username: 'developer', password: 'developer', role: 'admin' },
      { username: 'guest', password: 'guest', role: 'user' }
    ]);
    console.log('Seeded demo users');
  }
})().catch(err => console.error(err));

// ---------- Routes ----------
// Home -> redirect
app.get('/', (req, res) => {
  if (req.session && req.session.authenticated) return res.redirect('/books');
  return res.redirect('/login');
});

// Login/Logout (Lecture 7 cookie-session example)
app.get('/login', (req, res) => {
  res.status(200).render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findOne({ username: name });
  if (user && user.password === password) {
    req.session.authenticated = true;
    req.session.username = user.username;
    req.session.userId = user._id.toString();
    return res.redirect('/books');
  }
  return res.status(401).render('login', { error: 'Invalid credentials' });
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// CRUD web pages (protected) — Books
// List + Read with query filters (Originality bonus: multiple conditions)
// Filters: q (title/author regex), tag, yearMin/yearMax
app.get('/books', isLoggedIn, async (req, res) => {
  const owner = req.session.userId;
  const { q, tag, yearMin, yearMax } = req.query;
  const criteria = { owner };
  if (q) criteria.$or = [
    { title: { $regex: q, $options: 'i' } },
    { author: { $regex: q, $options: 'i' } }
  ];
  if (tag) criteria.tags = tag;
  if (yearMin || yearMax) {
    criteria.year = {};
    if (yearMin) criteria.year.$gte = Number(yearMin);
    if (yearMax) criteria.year.$lte = Number(yearMax);
  }
  const books = await Book.find(criteria).sort({ createdAt: -1 });
  res.status(200).render('books/list', { books, username: req.session.username, q, tag, yearMin, yearMax });
});

// Create form
app.get('/books/new', isLoggedIn, (req, res) => {
  res.status(200).render('books/form', { book: null, action: '/books', method: 'POST' });
});

// Create handler
app.post('/books', isLoggedIn, async (req, res) => {
  const { title, author, year, tags } = req.body;
  const doc = {
    title, author,
    year: year ? Number(year) : undefined,
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    owner: req.session.userId
  };
  await Book.create(doc);
  res.redirect('/books');
});

// Detail view
app.get('/books/:id', isLoggedIn, async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, owner: req.session.userId });
  if (!book) return res.status(404).send('Not found');
  res.status(200).render('books/detail', { book });
});

// Edit form (FIXED: action string now uses template literal, not RegExp)
app.get('/books/:id/edit', isLoggedIn, async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, owner: req.session.userId });
  if (!book) return res.status(404).send('Not found');
  res.status(200).render('books/form', {
    book,
    action: `/books/${book._id}?&_method=PUT`.replace('?&', '?'), // ensures proper ?_method=PUT
    method: 'POST'
  });
});

// Update handler
app.put('/books/:id', isLoggedIn, async (req, res) => {
  const { title, author, year, tags } = req.body;
  const update = {
    title, author,
    year: year ? Number(year) : undefined,
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
  };
  await Book.updateOne({ _id: req.params.id, owner: req.session.userId }, { $set: update });
  res.redirect('/books');
});

// Delete handler
app.delete('/books/:id', isLoggedIn, async (req, res) => {
  await Book.deleteOne({ _id: req.params.id, owner: req.session.userId });
  res.redirect('/books');
});

// ---------- RESTful APIs (no auth required, per requirement 3) ----------
// Base: /api/books

// Read (GET): support query by title regex and year range
app.get('/api/books', async (req, res) => {
  const { q, yearMin, yearMax } = req.query;
  const criteria = {};
  if (q) criteria.title = { $regex: q, $options: 'i' };
  if (yearMin || yearMax) {
    criteria.year = {};
    if (yearMin) criteria.year.$gte = Number(yearMin);
    if (yearMax) criteria.year.$lte = Number(yearMax);
  }
  const results = await Book.find(criteria).limit(50);
  res.status(200).type('json').json(results);
});

// Create (POST)
app.post('/api/books', async (req, res) => {
  const { title, author, year, tags, owner } = req.body;
  try {
    const created = await Book.create({
      title, author,
      year,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      owner // for demo: allow POST to specify owner; in production secure this
    });
    res.status(201).type('json').json(created);
  } catch (e) {
    res.status(400).type('json').json({ error: e.message });
  }
});

// Update (PUT)
app.put('/api/books/:id', async (req, res) => {
  try {
    const update = req.body;
    const result = await Book.updateOne({ _id: req.params.id }, { $set: update });
    res.status(200).type('json').json(result);
  } catch (e) {
    res.status(400).type('json').json({ error: e.message });
  }
});

// Delete (DELETE)
app.delete('/api/books/:id', async (req, res) => {
  try {
    const result = await Book.deleteOne({ _id: req.params.id });
    res.status(200).type('json').json(result);
  } catch (e) {
    res.status(400).type('json').json({ error: e.message });
  }
});

// Start (FIXED: template string for logging)
const PORT = process.env.PORT || 8099;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
