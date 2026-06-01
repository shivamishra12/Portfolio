/* ══════════════════════════════════════════════
   server.js — Shivam Mishra Portfolio Backend
   Express + SQLite + Session Auth
══════════════════════════════════════════════ */

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

/* ─── DATABASE SETUP ─────────────────────── */
const dbPath = process.env.DATABASE_PATH || './portfolio.db';
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id       INTEGER PRIMARY KEY,
    username TEXT    UNIQUE NOT NULL,
    password TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    full_desc   TEXT,
    emoji       TEXT    DEFAULT '🚀',
    image_url   TEXT    DEFAULT '',
    tags        TEXT    DEFAULT '',
    github_url  TEXT    DEFAULT '',
    linkedin_url TEXT   DEFAULT '',
    team        TEXT    DEFAULT '',
    gradient    TEXT    DEFAULT 'linear-gradient(135deg,#1a1a2e,#16213e)',
    is_pinned   INTEGER DEFAULT 0,
    gallery_urls TEXT   DEFAULT '',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    title          TEXT    NOT NULL,
    issuer         TEXT    DEFAULT '',
    date           TEXT    DEFAULT '',
    image_url      TEXT    DEFAULT '',
    credential_url TEXT    DEFAULT '',
    sort_order     INTEGER DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activities (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    image_urls  TEXT    DEFAULT '',
    certificates TEXT   DEFAULT '',
    date        TEXT    DEFAULT '',
    category    TEXT    DEFAULT '',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS upcoming_projects (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    description   TEXT    DEFAULT '',
    expected_date TEXT    DEFAULT '',
    status        TEXT    DEFAULT 'planning',
    tech_stack    TEXT    DEFAULT '',
    sort_order    INTEGER DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS partners (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    role        TEXT    NOT NULL,
    image_url   TEXT    DEFAULT '',
    link        TEXT    DEFAULT '',
    bio         TEXT    DEFAULT '',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    ip          TEXT    DEFAULT '',
    is_read     INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT    PRIMARY KEY,
    value       TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skills (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS education (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    icon        TEXT    DEFAULT '🎓',
    title       TEXT    NOT NULL,
    subtitle    TEXT    DEFAULT '',
    institution TEXT    DEFAULT '',
    date_range  TEXT    DEFAULT '',
    tags        TEXT    DEFAULT '',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    link        TEXT    NOT NULL,
    platform    TEXT    DEFAULT 'Medium',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS socials (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    url         TEXT    NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed admin if not exists
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

db.prepare('DELETE FROM admin WHERE username = ?').run('admin');
const adminExists = db.prepare('SELECT id FROM admin WHERE username = ?').get(adminEmail);
if (!adminExists) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run(adminEmail, hash);
  console.log(`✅  Default admin created — username: ${adminEmail}`);
}

// Seed resume_url setting if not exists
const resumeUrlExists = db.prepare('SELECT value FROM settings WHERE key = ?').get('resume_url');
if (!resumeUrlExists) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('resume_url', '');
}

// Seed other sections if empty

const activityCount = db.prepare('SELECT COUNT(*) as c FROM activities').get().c;
if (activityCount === 0) {
  const insert = db.prepare('INSERT INTO activities (title, description, image_urls, certificates, date, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insert.run('Smart India Hackathon 2024', 'Built a CNN model for plant crop disease detection, helping local farmers identify pathogenic anomalies with 92% precision.', '', 'Finalist Certificate', '2024-11-22', 'Hackathon', 1);
  insert.run('KIET Internal Codeathon', 'Won 1st prize for building a decentralized, real-time secure messaging system using WebSockets.', '', 'First Place Medal', '2025-02-14', 'Coding Contest', 2);
  console.log('✅ Sample activities seeded.');
}

const upcomingCount = db.prepare('SELECT COUNT(*) as c FROM upcoming_projects').get().c;
if (upcomingCount === 0) {
  const insert = db.prepare('INSERT INTO upcoming_projects (title, description, expected_date, status, tech_stack, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  insert.run('AI Medical Assistant', 'A multimodal AI diagnostic assistant combining vision-language models to analyze X-Ray scans and generate contextual notes.', '2026-08-30', 'in-progress', 'FastAPI,PyTorch,React', 1);
  insert.run('Decentralized AI Model Marketplace', 'A blockchain-based marketplace enabling trustless, secure verification and leasing of custom machine learning models.', '2026-11-15', 'planning', 'Solidity,Web3.js,Python', 2);
  console.log('✅ Sample upcoming projects seeded.');
}

// Seed skills if empty
const skillCount = db.prepare('SELECT COUNT(*) as c FROM skills').get().c;
if (skillCount === 0) {
  const insert = db.prepare('INSERT INTO skills (name, sort_order) VALUES (?, ?)');
  const defaultSkills = ['Python', 'FastAPI', 'Docker', 'AWS', 'React', 'PostgreSQL', 'Redis', 'Git'];
  defaultSkills.forEach((name, i) => insert.run(name, i + 1));
  console.log('✅ Default skills seeded.');
}

// Seed education if empty
const eduCount = db.prepare('SELECT COUNT(*) as c FROM education').get().c;
if (eduCount === 0) {
  const insert = db.prepare('INSERT INTO education (icon, title, subtitle, institution, date_range, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insert.run('🎓', 'B.Tech — Computer Science', 'Specialization: AI & Data Science', 'KIET Group Of Institutions', '2024 – 2028', '', 1);
  insert.run('🤖', 'Machine Learning', 'Deep Learning · NLP · Computer Vision', '', '', 'PyTorch, TensorFlow, Scikit-learn', 2);
  insert.run('📊', 'Data Science & Engineering', 'Analytics · Visualization · Pipelines', '', '', 'SQL, Spark, Airflow', 3);
  console.log('✅ Sample education seeded.');
}

// Seed blogs if empty
const blogCount = db.prepare('SELECT COUNT(*) as c FROM blogs').get().c;
if (blogCount === 0) {
  const insert = db.prepare('INSERT INTO blogs (title, description, link, platform, sort_order) VALUES (?, ?, ?, ?, ?)');
  insert.run(
    'Building PerformAI: High-performance AI benchmarking',
    'A detailed guide on evaluating and visualizing AI model metrics dynamically in the browser.',
    'https://github.com/shivamishra12/PerformAI',
    'Dev.to',
    1
  );
  insert.run(
    'My Journey in Smart India Hackathon 2024',
    'How we built a CNN-based crop disease classifier and reached the national finals.',
    'https://github.com/shivamishra12',
    'Medium',
    2
  );
  console.log('✅ Sample blogs seeded.');
}

// Seed socials if empty
const socialCount = db.prepare('SELECT COUNT(*) as c FROM socials').get().c;
if (socialCount === 0) {
  const insert = db.prepare('INSERT INTO socials (name, url, sort_order) VALUES (?, ?, ?)');
  insert.run('GitHub', 'https://github.com/shivamishra12', 1);
  insert.run('LinkedIn', 'https://www.linkedin.com/in/shivam-kumar-aa1345309/', 2);
  insert.run('Instagram', 'https://www.instagram.com/svu_u_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', 3);
  insert.run('Email', 'mailto:shivamwork321@gmail.com', 4);
  insert.run('Phone', 'tel:+917903937126', 5);
  console.log('✅ Default socials seeded.');
}

// Seed sample projects if they match legacy projects or if projects table is empty
const existingProjects = db.prepare('SELECT title FROM projects').all().map(p => p.title);
const legacyTitles = [
  'Deepfake Detection System',
  'MicroCareerAI',
  'AI Chatbot',
  'Movie Recommendation System',
  'Sentiment Analysis System',
  'Data Visualization Dashboard',
  'AI Developer Portfolio',
  'EcoTrack Waste Management',
  'JarvisAI Voice Assistant'
];
// Check if the database contains any of the old projects we want to clean up or if length is incorrect
const hasLegacy = existingProjects.some(t => legacyTitles.includes(t)) || existingProjects.length !== 5;
if (existingProjects.length === 0 || hasLegacy) {
  db.prepare('DELETE FROM projects').run();
  const insert = db.prepare(`
    INSERT INTO projects (title, description, full_desc, emoji, tags, github_url, linkedin_url, team, gradient, is_pinned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const samples = [
    [
      'PerformAI',
      'High-performance AI model evaluation and visualization interface.',
      'A modern, high-performance web interface designed to benchmark, evaluate, and visualize performance metrics of various AI and machine learning models in real time.',
      '⚡',
      'JavaScript, AI Benchmarking, Web',
      'https://github.com/shivamishra12/PerformAI',
      'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
      'Shivam Kumar',
      'linear-gradient(135deg,#0f0c29,#302b63)',
      1
    ],
    [
      'MERN Lost & Found System',
      'Full-stack web application to report and track lost and found items.',
      'A complete full-stack web application built using the MERN stack (MongoDB, Express, React, Node.js) with production database integration to securely track, match, and recover lost assets.',
      '🔍',
      'React, Node.js, Express, MongoDB',
      'https://github.com/shivamishra12/lost-found-system',
      'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
      'Shivam Kumar',
      'linear-gradient(135deg,#134e5e,#71b280)',
      1
    ],
    [
      'Stock Trading Web App',
      'Interactive mock stock trading platform with real-time tracking.',
      'A mock stock trading application designed to simulate financial market exchanges, supporting portfolio evaluation, watchlists, and transaction simulations.',
      '📈',
      'JavaScript, Finance, Simulated Trading',
      'https://github.com/shivamishra12/Stock-Trading-Web-App',
      'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
      'Shivam Kumar',
      'linear-gradient(135deg,#0a3d62,#1e3799)',
      1
    ],
    [
      'Deep Learnings Modules',
      'Lab work and assignments implementing foundational deep learning models.',
      'This repository contains hands-on implementations of core deep learning algorithms, including CNNs, RNNs, and neural network tuning techniques, mapped to academic and research tasks.',
      '🧠',
      'Jupyter Notebook, Deep Learning, CNN, PyTorch',
      'https://github.com/shivamishra12/DEEP-LEARNINGS-MODULES',
      'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
      'Shivam Kumar',
      'linear-gradient(135deg,#1a1a2e,#16213e)',
      1
    ],
    [
      'Disease Genetic Predictor',
      'Predictive model combining genetic and clinical attributes for outcomes.',
      'A machine learning pipeline evaluating mixed genetic markers and clinical features to estimate prognostic disease outcomes and patient health risks.',
      '🧬',
      'Jupyter Notebook, Bioinformatics, ML',
      'https://github.com/shivamishra12/Predict-Disease-Outcome-Based-on-Genetic-and-Clinical-Data',
      'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
      'Shivam Kumar',
      'linear-gradient(135deg,#16a085,#2ecc71)',
      1
    ]
  ];
  samples.forEach(s => insert.run(...s));
  console.log('✅  Sample projects seeded (5 best and complete GitHub projects).');
}

/* ─── UPLOADS ROUTING ──────────────────────── */
const UPLOADS_DIR = process.env.UPLOADS_PATH || path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/* ─── MIDDLEWARE ──────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(session({
  secret: process.env.SESSION_SECRET || 'groot-is-groot-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

/* ─── MULTER (image uploads) ─────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only image and PDF files allowed'));
  }
});

/* ─── AUTH MIDDLEWARE ─────────────────────── */
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/login');
}

/* ════════════════════════════════════════════
   PUBLIC API — used by portfolio frontend
   ════════════════════════════════════════════ */

// Helper to reorder items based on chosen position
function reorderItems(table, itemId, position, customPos) {
  const items = db.prepare(`SELECT id, sort_order FROM ${table} ORDER BY sort_order ASC, id ASC`).all();
  const targetIndex = items.findIndex(item => item.id === itemId);
  if (targetIndex === -1) return;
  const targetItem = items.splice(targetIndex, 1)[0];

  let newIndex;
  const len = items.length;
  if (position === 'top') {
    newIndex = 0;
  } else if (position === 'middle') {
    newIndex = Math.floor(len / 2);
  } else if (position === 'bottom') {
    newIndex = len;
  } else if (position === 'custom') {
    const rank = parseInt(customPos, 10) || 1;
    newIndex = Math.max(0, Math.min(len, rank - 1));
  } else {
    newIndex = len;
  }

  items.splice(newIndex, 0, targetItem);

  const updateStmt = db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`);
  db.transaction((list) => {
    list.forEach((item, idx) => {
      updateStmt.run(idx + 1, item.id);
    });
  })(items);
}

// GET /api/skills — all skills
app.get('/api/skills', (req, res) => {
  try {
    const skills = db.prepare('SELECT * FROM skills ORDER BY sort_order ASC, name ASC').all();
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/education — all education & background items
app.get('/api/education', (req, res) => {
  try {
    const education = db.prepare('SELECT * FROM education ORDER BY sort_order ASC, title ASC').all();
    const parsed = education.map(e => ({
      ...e,
      tags: e.tags ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects — all projects for the public portfolio
app.get('/api/projects', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY is_pinned DESC, created_at DESC').all();
  // Parse tags string → array
  const parsed = projects.map(p => ({
    ...p,
    tags: p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  }));
  res.json(parsed);
});

// GET /api/projects/:id — single project detail
app.get('/api/projects/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  project.tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  res.json(project);
});

// GET /api/certificates
app.get('/api/certificates', (req, res) => {
  try {
    const certificates = db.prepare('SELECT * FROM certificates ORDER BY sort_order ASC, date DESC').all();
    res.json(certificates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activities
app.get('/api/activities', (req, res) => {
  try {
    const activities = db.prepare('SELECT * FROM activities ORDER BY sort_order ASC, date DESC').all();
    const parsed = activities.map(a => ({
      ...a,
      image_urls: a.image_urls ? a.image_urls.split(',').map(u => u.trim()).filter(Boolean) : [],
      certificates: a.certificates ? a.certificates.split(',').map(c => c.trim()).filter(Boolean) : []
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upcoming
app.get('/api/upcoming', (req, res) => {
  try {
    const upcoming = db.prepare('SELECT * FROM upcoming_projects ORDER BY sort_order ASC, expected_date ASC').all();
    const parsed = upcoming.map(u => ({
      ...u,
      tech_stack: u.tech_stack ? u.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : []
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/partners
app.get('/api/partners', (req, res) => {
  try {
    const partners = db.prepare('SELECT * FROM partners ORDER BY sort_order ASC, name ASC').all();
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resume
app.get('/api/resume', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('resume_url');
    res.json({ url: row ? row.value : '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blogs
app.get('/api/blogs', (req, res) => {
  try {
    const blogs = db.prepare('SELECT * FROM blogs ORDER BY sort_order ASC, created_at DESC').all();
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/socials
app.get('/api/socials', (req, res) => {
  try {
    const socials = db.prepare('SELECT * FROM socials ORDER BY sort_order ASC').all();
    res.json(socials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages — submit contact form message
app.post('/api/messages', (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    db.prepare('INSERT INTO messages (name, email, message, ip) VALUES (?, ?, ?, ?)').run(name, email, message, ip);
    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════
   AUTH ROUTES
════════════════════════════════════════════ */

// GET /api/auth-check
app.get('/api/auth-check', (req, res) => {
  if (req.session && req.session.admin) {
    return res.json({ authenticated: true, username: req.session.admin.username });
  }
  res.json({ authenticated: false });
});

// POST /login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.json({ success: false, message: 'Invalid username or password.' });
  }
  req.session.admin = { id: admin.id, username: admin.username };
  res.json({ success: true });
});

// POST /logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

/* ════════════════════════════════════════════
   ADMIN ROUTES (protected)
════════════════════════════════════════════ */

// GET /admin — dashboard
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

/* ─── ADMIN API ───────────────────────────── */

// GET /admin/api/projects
app.get('/admin/api/projects', requireAuth, (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY is_pinned DESC, created_at DESC').all();
  res.json(projects.map(p => ({
    ...p,
    tags: p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  })));
});

// POST /admin/api/projects — create
app.post('/admin/api/projects', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), (req, res) => {
  try {
    const { title, description, full_desc, emoji, tags, github_url, linkedin_url, team, gradient, is_pinned } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required.' });

    const image_url = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : '';
    const gallery_urls = req.files && req.files.gallery ? req.files.gallery.map(f => `/uploads/${f.filename}`).join(',') : '';
    const pinned = is_pinned === 'true' || is_pinned === '1' ? 1 : 0;
    const result = db.prepare(`
      INSERT INTO projects (title, description, full_desc, emoji, image_url, tags, github_url, linkedin_url, team, gradient, is_pinned, gallery_urls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, full_desc || '', emoji || '🚀', image_url, tags || '', github_url || '', linkedin_url || '', team || '', gradient || 'linear-gradient(135deg,#1a1a2e,#16213e)', pinned, gallery_urls);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/projects/:id — update
app.put('/admin/api/projects/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), (req, res) => {
  try {
    const { title, description, full_desc, emoji, tags, github_url, linkedin_url, team, gradient, is_pinned } = req.body;
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const image_url = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : existing.image_url;

    let gallery_urls = existing.gallery_urls || '';
    if (req.files && req.files.gallery) {
      const newUrls = req.files.gallery.map(f => `/uploads/${f.filename}`).join(',');
      gallery_urls = gallery_urls ? gallery_urls + ',' + newUrls : newUrls;
    }
    const pinned = is_pinned === 'true' || is_pinned === '1' ? 1 : 0;

    db.prepare(`
      UPDATE projects
      SET title=?, description=?, full_desc=?, emoji=?, image_url=?, tags=?,
          github_url=?, linkedin_url=?, team=?, gradient=?, is_pinned=?, gallery_urls=?
      WHERE id=?
    `).run(title, description, full_desc || '', emoji || '🚀', image_url, tags || '',
      github_url || '', linkedin_url || '', team || '', gradient || existing.gradient, pinned, gallery_urls, req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/projects/:id
app.delete('/admin/api/projects/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Delete uploaded image file if exists
    if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, 'public', existing.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── CERTIFICATES ADMIN CRUD ─── */

// GET /admin/api/certificates
app.get('/admin/api/certificates', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM certificates ORDER BY sort_order ASC, date DESC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/certificates
app.post('/admin/api/certificates', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
  try {
    const { title, issuer, date, credential_url, sort_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    const image_url = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : '';
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('INSERT INTO certificates (title, issuer, date, image_url, credential_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .run(title, issuer || '', date || '', image_url, credential_url || '', order);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/certificates/:id
app.put('/admin/api/certificates/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
  try {
    const { title, issuer, date, credential_url, sort_order } = req.body;
    const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    const image_url = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : existing.image_url;
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('UPDATE certificates SET title=?, issuer=?, date=?, image_url=?, credential_url=?, sort_order=? WHERE id=?')
      .run(title, issuer || '', date || '', image_url, credential_url || '', order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/certificates/:id
app.delete('/admin/api/certificates/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, 'public', existing.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM certificates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── ACTIVITIES ADMIN CRUD ─── */

// GET /admin/api/activities
app.get('/admin/api/activities', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM activities ORDER BY sort_order ASC, date DESC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/activities
app.post('/admin/api/activities', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), (req, res) => {
  try {
    const { title, description, certificates, date, category, sort_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    const image_url = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : '';
    const newGallery = req.files && req.files.gallery ? req.files.gallery.map(f => `/uploads/${f.filename}`).join(',') : '';
    const image_urls = image_url ? (newGallery ? image_url + ',' + newGallery : image_url) : newGallery;
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('INSERT INTO activities (title, description, image_urls, certificates, date, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(title, description || '', image_urls, certificates || '', date || '', category || '', order);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/activities/:id
app.put('/admin/api/activities/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), (req, res) => {
  try {
    const { title, description, certificates, date, category, sort_order } = req.body;
    const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });

    let currentUrls = existing.image_urls || '';
    if (req.files && req.files.image) {
      const newCover = `/uploads/${req.files.image[0].filename}`;
      const parts = currentUrls.split(',').filter(Boolean);
      if (parts.length > 0) parts[0] = newCover;
      else parts.push(newCover);
      currentUrls = parts.join(',');
    }
    if (req.files && req.files.gallery) {
      const newGals = req.files.gallery.map(f => `/uploads/${f.filename}`).join(',');
      currentUrls = currentUrls ? currentUrls + ',' + newGals : newGals;
    }
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('UPDATE activities SET title=?, description=?, image_urls=?, certificates=?, date=?, category=?, sort_order=? WHERE id=?')
      .run(title, description || '', currentUrls, certificates || '', date || '', category || '', order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/activities/:id
app.delete('/admin/api/activities/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (existing.image_urls) {
      existing.image_urls.split(',').filter(Boolean).forEach(url => {
        if (url.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, 'public', url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });
    }
    db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── UPCOMING PROJECTS ADMIN CRUD ─── */

// GET /admin/api/upcoming
app.get('/admin/api/upcoming', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM upcoming_projects ORDER BY sort_order ASC, expected_date ASC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/upcoming
app.post('/admin/api/upcoming', requireAuth, (req, res) => {
  try {
    const { title, description, expected_date, status, tech_stack, sort_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('INSERT INTO upcoming_projects (title, description, expected_date, status, tech_stack, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .run(title, description || '', expected_date || '', status || 'planning', tech_stack || '', order);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/upcoming/:id
app.put('/admin/api/upcoming/:id', requireAuth, (req, res) => {
  try {
    const { title, description, expected_date, status, tech_stack, sort_order } = req.body;
    const existing = db.prepare('SELECT * FROM upcoming_projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('UPDATE upcoming_projects SET title=?, description=?, expected_date=?, status=?, tech_stack=?, sort_order=? WHERE id=?')
      .run(title, description || '', expected_date || '', status || 'planning', tech_stack || '', order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/upcoming/:id
app.delete('/admin/api/upcoming/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM upcoming_projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── PARTNERS ADMIN CRUD ─── */

// GET /admin/api/partners
app.get('/admin/api/partners', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM partners ORDER BY sort_order ASC, name ASC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/partners
app.post('/admin/api/partners', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
  try {
    const { name, role, link, bio, sort_order } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Name and role are required.' });
    const image_url = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : '';
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('INSERT INTO partners (name, role, image_url, link, bio, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .run(name, role, image_url, link || '', bio || '', order);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/partners/:id
app.put('/admin/api/partners/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
  try {
    const { name, role, link, bio, sort_order } = req.body;
    const existing = db.prepare('SELECT * FROM partners WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    const image_url = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : existing.image_url;
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('UPDATE partners SET name=?, role=?, image_url=?, link=?, bio=?, sort_order=? WHERE id=?')
      .run(name, role, image_url, link || '', bio || '', order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/partners/:id
app.delete('/admin/api/partners/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM partners WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, 'public', existing.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM partners WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── BLOGS ADMIN CRUD ─── */
app.get('/admin/api/blogs', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM blogs ORDER BY sort_order ASC, created_at DESC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/api/blogs', requireAuth, (req, res) => {
  try {
    const { title, description, link, platform, sort_order } = req.body;
    if (!title || !link) return res.status(400).json({ error: 'Title and link are required.' });
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('INSERT INTO blogs (title, description, link, platform, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(title, description || '', link, platform || 'Medium', order);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/api/blogs/:id', requireAuth, (req, res) => {
  try {
    const { title, description, link, platform, sort_order } = req.body;
    if (!title || !link) return res.status(400).json({ error: 'Title and link are required.' });
    const existing = db.prepare('SELECT * FROM blogs WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Blog not found.' });
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('UPDATE blogs SET title=?, description=?, link=?, platform=?, sort_order=? WHERE id=?')
      .run(title, description || '', link, platform || 'Medium', order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/api/blogs/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM blogs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── SOCIALS ADMIN CRUD ─── */
app.get('/admin/api/socials', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM socials ORDER BY sort_order ASC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/api/socials', requireAuth, (req, res) => {
  try {
    const { name, url, sort_order } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and URL are required.' });
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('INSERT INTO socials (name, url, sort_order) VALUES (?, ?, ?)')
      .run(name, url, order);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/api/socials/:id', requireAuth, (req, res) => {
  try {
    const { name, url, sort_order } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and URL are required.' });
    const existing = db.prepare('SELECT * FROM socials WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Social link not found.' });
    const order = parseInt(sort_order, 10) || 0;
    db.prepare('UPDATE socials SET name=?, url=?, sort_order=? WHERE id=?')
      .run(name, url, order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/api/socials/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM socials WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── MESSAGES ADMIN API ─── */

// GET /admin/api/messages
app.get('/admin/api/messages', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/messages/:id/read
app.put('/admin/api/messages/:id/read', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/messages/:id
app.delete('/admin/api/messages/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── SKILLS ADMIN CRUD ─── */

// GET /admin/api/skills
app.get('/admin/api/skills', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM skills ORDER BY sort_order ASC, name ASC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/skills
app.post('/admin/api/skills', requireAuth, (req, res) => {
  try {
    const { name, position, custom_pos } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name is required.' });

    // Insert with dummy sort_order
    const result = db.prepare('INSERT INTO skills (name, sort_order) VALUES (?, 999999)').run(name);
    const newId = result.lastInsertRowid;

    // Reorder based on position requested
    reorderItems('skills', newId, position, custom_pos);

    res.json({ success: true, id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/skills/:id
app.put('/admin/api/skills/:id', requireAuth, (req, res) => {
  try {
    const { name, position, custom_pos } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name is required.' });

    const existing = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Skill not found.' });

    // Update name
    db.prepare('UPDATE skills SET name = ? WHERE id = ?').run(name, req.params.id);

    // Reorder
    reorderItems('skills', existing.id, position, custom_pos);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/skills/:id
app.delete('/admin/api/skills/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Skill not found.' });

    db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);

    // Compact remaining sort_orders
    const items = db.prepare('SELECT id FROM skills ORDER BY sort_order ASC, id ASC').all();
    const updateStmt = db.prepare('UPDATE skills SET sort_order = ? WHERE id = ?');
    db.transaction((list) => {
      list.forEach((item, idx) => updateStmt.run(idx + 1, item.id));
    })(items);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── EDUCATION ADMIN CRUD ─── */

// GET /admin/api/education
app.get('/admin/api/education', requireAuth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM education ORDER BY sort_order ASC, title ASC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/education
app.post('/admin/api/education', requireAuth, (req, res) => {
  try {
    const { icon, title, subtitle, institution, date_range, tags, position, custom_pos } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    // Insert with dummy sort_order
    const result = db.prepare(`
      INSERT INTO education (icon, title, subtitle, institution, date_range, tags, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, 999999)
    `).run(icon || '🎓', title, subtitle || '', institution || '', date_range || '', tags || '');

    const newId = result.lastInsertRowid;

    // Reorder based on position requested
    reorderItems('education', newId, position, custom_pos);

    res.json({ success: true, id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/education/:id
app.put('/admin/api/education/:id', requireAuth, (req, res) => {
  try {
    const { icon, title, subtitle, institution, date_range, tags, position, custom_pos } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const existing = db.prepare('SELECT * FROM education WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Education entry not found.' });

    // Update
    db.prepare(`
      UPDATE education
      SET icon = ?, title = ?, subtitle = ?, institution = ?, date_range = ?, tags = ?
      WHERE id = ?
    `).run(icon || '🎓', title, subtitle || '', institution || '', date_range || '', tags || '', req.params.id);

    // Reorder
    reorderItems('education', existing.id, position, custom_pos);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/education/:id
app.delete('/admin/api/education/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM education WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Education entry not found.' });

    db.prepare('DELETE FROM education WHERE id = ?').run(req.params.id);

    // Compact remaining sort_orders
    const items = db.prepare('SELECT id FROM education ORDER BY sort_order ASC, id ASC').all();
    const updateStmt = db.prepare('UPDATE education SET sort_order = ? WHERE id = ?');
    db.transaction((list) => {
      list.forEach((item, idx) => updateStmt.run(idx + 1, item.id));
    })(items);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── RESUME ADMIN API ─── */

// POST /admin/api/resume
app.post('/admin/api/resume', requireAuth, upload.fields([{ name: 'resume', maxCount: 1 }]), (req, res) => {
  try {
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const resumeUrl = `/uploads/${req.files.resume[0].filename}`;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('resume_url', resumeUrl);
    res.json({ success: true, url: resumeUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/change-password
app.post('/admin/api/change-password', requireAuth, (req, res) => {
  const { current, newpass, confirm } = req.body;
  if (newpass !== confirm) return res.json({ success: false, message: 'New passwords do not match.' });
  if (newpass.length < 6) return res.json({ success: false, message: 'Password must be at least 6 characters.' });

  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.session.admin.id);
  if (!bcrypt.compareSync(current, admin.password)) {
    return res.json({ success: false, message: 'Current password is incorrect.' });
  }

  const hash = bcrypt.hashSync(newpass, 10);
  db.prepare('UPDATE admin SET password = ? WHERE id = ?').run(hash, admin.id);
  res.json({ success: true, message: 'Password updated successfully.' });
});

// POST /admin/api/change-username
app.post('/admin/api/change-username', requireAuth, (req, res) => {
  const { newUsername, password } = req.body;
  if (!newUsername || newUsername.trim() === '') return res.json({ success: false, message: 'New username cannot be empty.' });

  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.session.admin.id);
  if (!bcrypt.compareSync(password, admin.password)) {
    return res.json({ success: false, message: 'Password is incorrect.' });
  }

  try {
    db.prepare('UPDATE admin SET username = ? WHERE id = ?').run(newUsername.trim(), admin.id);
    req.session.admin.username = newUsername.trim();
    res.json({ success: true, message: 'Username updated successfully.' });
  } catch (err) {
    res.json({ success: false, message: 'Error updating username.' });
  }
});

/* ─── CATCH-ALL → portfolio ─────────────── */
app.get(['/', '/login', '/admin'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* ─── START ──────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  Portfolio running at → http://localhost:${PORT}`);
  console.log(`🔒  Admin panel         → http://localhost:${PORT}/admin`);
  console.log(`🔑  Login credentials   → Configured via ADMIN_EMAIL and ADMIN_PASSWORD environment variables (Fallback: admin@example.com / password123)\n`);
});
