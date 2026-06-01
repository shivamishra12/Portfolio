/* ══════════════════════════════════════════════
   server.js — Shivam Mishra Portfolio Backend
   Express + MongoDB + Session Auth
   ══════════════════════════════════════════════ */
require('dotenv').config();

// Validate critical environment variables
const requiredEnv = ['MONGODB_URI', 'SESSION_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missingEnv = requiredEnv.filter(name => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`\n❌  CRITICAL CONFIGURATION ERROR: Missing required environment variable(s): ${missingEnv.join(', ')}`);
  console.error('Please configure them in your .env file or production environment settings.\n');
  process.exit(1);
}

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

/* ─── DATABASE SETUP ─────────────────────── */
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅  Connected to MongoDB successfully');
    if (process.env.ENABLE_SEEDING === 'true') {
      seedDatabase();
    }
  })
  .catch(err => {
    console.error('❌  MongoDB connection error:', err);
    process.exit(1);
  });

const schemaOptions = {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
};

// 1. Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, schemaOptions);
const Admin = mongoose.model('Admin', adminSchema);

// 2. Project Schema
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  full_desc: { type: String, default: '' },
  emoji: { type: String, default: '🚀' },
  image_url: { type: String, default: '' },
  tags: { type: String, default: '' },
  github_url: { type: String, default: '' },
  linkedin_url: { type: String, default: '' },
  team: { type: String, default: '' },
  gradient: { type: String, default: 'linear-gradient(135deg,#1a1a2e,#16213e)' },
  is_pinned: { type: Number, default: 0 },
  gallery_urls: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Project = mongoose.model('Project', projectSchema);

// 3. Certificate Schema
const certificateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  issuer: { type: String, default: '' },
  date: { type: String, default: '' },
  image_url: { type: String, default: '' },
  credential_url: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Certificate = mongoose.model('Certificate', certificateSchema);

// 4. Activity Schema
const activitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image_urls: { type: String, default: '' },
  certificates: { type: String, default: '' },
  date: { type: String, default: '' },
  category: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Activity = mongoose.model('Activity', activitySchema);

// 5. Upcoming Project Schema
const upcomingProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  expected_date: { type: String, default: '' },
  status: { type: String, default: 'planning' },
  tech_stack: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const UpcomingProject = mongoose.model('UpcomingProject', upcomingProjectSchema);

// 6. Partner Schema
const partnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  image_url: { type: String, default: '' },
  link: { type: String, default: '' },
  bio: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Partner = mongoose.model('Partner', partnerSchema);

// 7. Message Schema
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  ip: { type: String, default: '' },
  is_read: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Message = mongoose.model('Message', messageSchema);

// 8. Setting Schema
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: '' }
}, schemaOptions);
const Setting = mongoose.model('Setting', settingSchema);

// 9. Skill Schema
const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Skill = mongoose.model('Skill', skillSchema);

// 10. Education Schema
const educationSchema = new mongoose.Schema({
  icon: { type: String, default: '🎓' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  institution: { type: String, default: '' },
  date_range: { type: String, default: '' },
  tags: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Education = mongoose.model('Education', educationSchema);

// 11. Blog Schema
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  link: { type: String, required: true },
  platform: { type: String, default: 'Medium' },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Blog = mongoose.model('Blog', blogSchema);

// 12. Social Schema
const socialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);
const Social = mongoose.model('Social', socialSchema);

// 13. Media Schema (for database-backed uploads)
const mediaSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
  size: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
});
const Media = mongoose.model('Media', mediaSchema);

/* ─── UPLOADS HELPERS (DATABASE BACKED) ───── */

async function saveFile(file) {
  if (!file) return '';
  const filename = Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname);
  const media = new Media({
    filename,
    contentType: file.mimetype,
    data: file.buffer,
    size: file.size || 0
  });
  await media.save();
  return `/uploads/${filename}`;
}

async function deleteFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const filename = url.replace('/uploads/', '');
  await Media.deleteOne({ filename });
}

/* ─── DATABASE SEEDING ───────────────────── */
async function seedDatabase() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Clear and reset legacy simple admin username if it exists
    await Admin.deleteOne({ username: 'admin' });

    const adminExists = await Admin.findOne({ username: adminEmail });
    if (!adminExists) {
      const hash = bcrypt.hashSync(adminPassword, 10);
      await Admin.create({ username: adminEmail, password: hash });
      console.log(`✅ Default admin created — username: ${adminEmail}`);
    }

    // Seed resume_url setting
    const resumeUrlExists = await Setting.findOne({ key: 'resume_url' });
    if (!resumeUrlExists) {
      await Setting.create({ key: 'resume_url', value: '' });
    }

    // Seed activities
    const activityCount = await Activity.countDocuments();
    if (activityCount === 0) {
      await Activity.create([
        {
          title: 'Smart India Hackathon 2024',
          description: 'Built a CNN model for plant crop disease detection, helping local farmers identify pathogenic anomalies with 92% precision.',
          image_urls: '',
          certificates: 'Finalist Certificate',
          date: '2024-11-22',
          category: 'Hackathon',
          sort_order: 1
        },
        {
          title: 'KIET Internal Codeathon',
          description: 'Won 1st prize for building a decentralized, real-time secure messaging system using WebSockets.',
          image_urls: '',
          certificates: 'First Place Medal',
          date: '2025-02-14',
          category: 'Coding Contest',
          sort_order: 2
        }
      ]);
      console.log('✅ Sample activities seeded.');
    }

    // Seed upcoming projects
    const upcomingCount = await UpcomingProject.countDocuments();
    if (upcomingCount === 0) {
      await UpcomingProject.create([
        {
          title: 'AI Medical Assistant',
          description: 'A multimodal AI diagnostic assistant combining vision-language models to analyze X-Ray scans and generate contextual notes.',
          expected_date: '2026-08-30',
          status: 'in-progress',
          tech_stack: 'FastAPI,PyTorch,React',
          sort_order: 1
        },
        {
          title: 'Decentralized AI Model Marketplace',
          description: 'A blockchain-based marketplace enabling trustless, secure verification and leasing of custom machine learning models.',
          expected_date: '2026-11-15',
          status: 'planning',
          tech_stack: 'Solidity,Web3.js,Python',
          sort_order: 2
        }
      ]);
      console.log('✅ Sample upcoming projects seeded.');
    }

    // Seed skills
    const skillCount = await Skill.countDocuments();
    if (skillCount === 0) {
      const defaultSkills = ['Python', 'FastAPI', 'Docker', 'AWS', 'React', 'PostgreSQL', 'Redis', 'Git'];
      const skillDocs = defaultSkills.map((name, i) => ({ name, sort_order: i + 1 }));
      await Skill.create(skillDocs);
      console.log('✅ Default skills seeded.');
    }

    // Seed education
    const eduCount = await Education.countDocuments();
    if (eduCount === 0) {
      await Education.create([
        {
          icon: '🎓',
          title: 'B.Tech — Computer Science',
          subtitle: 'Specialization: AI & Data Science',
          institution: 'KIET Group Of Institutions',
          date_range: '2024 – 2028',
          tags: '',
          sort_order: 1
        },
        {
          icon: '🤖',
          title: 'Machine Learning',
          subtitle: 'Deep Learning · NLP · Computer Vision',
          institution: '',
          date_range: '',
          tags: 'PyTorch, TensorFlow, Scikit-learn',
          sort_order: 2
        },
        {
          icon: '📊',
          title: 'Data Science & Engineering',
          subtitle: 'Analytics · Visualization · Pipelines',
          institution: '',
          date_range: '',
          tags: 'SQL, Spark, Airflow',
          sort_order: 3
        }
      ]);
      console.log('✅ Sample education seeded.');
    }

    // Seed blogs
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      await Blog.create([
        {
          title: 'Building PerformAI: High-performance AI benchmarking',
          description: 'A detailed guide on evaluating and visualizing AI model metrics dynamically in the browser.',
          link: 'https://github.com/shivamishra12/PerformAI',
          platform: 'Dev.to',
          sort_order: 1
        },
        {
          title: 'My Journey in Smart India Hackathon 2024',
          description: 'How we built a CNN-based crop disease classifier and reached the national finals.',
          link: 'https://github.com/shivamishra12',
          platform: 'Medium',
          sort_order: 2
        }
      ]);
      console.log('✅ Sample blogs seeded.');
    }

    // Seed socials
    const socialCount = await Social.countDocuments();
    if (socialCount === 0) {
      await Social.create([
        { name: 'GitHub', url: 'https://github.com/shivamishra12', sort_order: 1 },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/shivam-kumar-aa1345309/', sort_order: 2 },
        { name: 'Instagram', url: 'https://www.instagram.com/svu_u_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', sort_order: 3 },
        { name: 'Email', url: 'mailto:shivamwork321@gmail.com', sort_order: 4 },
        { name: 'Phone', url: 'tel:+917903937126', sort_order: 5 }
      ]);
      console.log('✅ Default socials seeded.');
    }

    // Seed projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.create([
        {
          title: 'PerformAI',
          description: 'High-performance AI model evaluation and visualization interface.',
          full_desc: 'A modern, high-performance web interface designed to benchmark, evaluate, and visualize performance metrics of various AI and machine learning models in real time.',
          emoji: '⚡',
          tags: 'JavaScript, AI Benchmarking, Web',
          github_url: 'https://github.com/shivamishra12/PerformAI',
          linkedin_url: 'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
          team: 'Shivam Kumar',
          gradient: 'linear-gradient(135deg,#0f0c29,#302b63)',
          is_pinned: 1,
          gallery_urls: ''
        },
        {
          title: 'MERN Lost & Found System',
          description: 'Full-stack web application to report and track lost and found items.',
          full_desc: 'A complete full-stack web application built using the MERN stack (MongoDB, Express, React, Node.js) with production database integration to securely track, match, and recover lost assets.',
          emoji: '🔍',
          tags: 'React, Node.js, Express, MongoDB',
          github_url: 'https://github.com/shivamishra12/lost-found-system',
          linkedin_url: 'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
          team: 'Shivam Kumar',
          gradient: 'linear-gradient(135deg,#134e5e,#71b280)',
          is_pinned: 1,
          gallery_urls: ''
        },
        {
          title: 'Stock Trading Web App',
          description: 'Interactive mock stock trading platform with real-time tracking.',
          full_desc: 'A mock stock trading application designed to simulate financial market exchanges, supporting portfolio evaluation, watchlists, and transaction simulations.',
          emoji: '📈',
          tags: 'JavaScript, Finance, Simulated Trading',
          github_url: 'https://github.com/shivamishra12/Stock-Trading-Web-App',
          linkedin_url: 'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
          team: 'Shivam Kumar',
          gradient: 'linear-gradient(135deg,#0a3d62,#1e3799)',
          is_pinned: 1,
          gallery_urls: ''
        },
        {
          title: 'Deep Learnings Modules',
          description: 'Lab work and assignments implementing foundational deep learning models.',
          full_desc: 'This repository contains hands-on implementations of core deep learning algorithms, including CNNs, RNNs, and neural network tuning techniques, mapped to academic and research tasks.',
          emoji: '🧠',
          tags: 'Jupyter Notebook, Deep Learning, CNN, PyTorch',
          github_url: 'https://github.com/shivamishra12/DEEP-LEARNINGS-MODULES',
          linkedin_url: 'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
          team: 'Shivam Kumar',
          gradient: 'linear-gradient(135deg,#1a1a2e,#16213e)',
          is_pinned: 1,
          gallery_urls: ''
        },
        {
          title: 'Disease Genetic Predictor',
          description: 'Predictive model combining genetic and clinical attributes for outcomes.',
          full_desc: 'A machine learning pipeline evaluating mixed genetic markers and clinical features to estimate prognostic disease outcomes and patient health risks.',
          emoji: '🧬',
          tags: 'Jupyter Notebook, Bioinformatics, ML',
          github_url: 'https://github.com/shivamishra12/Predict-Disease-Outcome-Based-on-Genetic-and-Clinical-Data',
          linkedin_url: 'https://www.linkedin.com/in/shivam-kumar-aa1345309/',
          team: 'Shivam Kumar',
          gradient: 'linear-gradient(135deg,#16a085,#2ecc71)',
          is_pinned: 1,
          gallery_urls: ''
        }
      ]);
      console.log('✅ Sample projects seeded.');
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
}

/* ─── MIDDLEWARE ──────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Trust proxy for secure cookies behind reverse proxies (like Render)
app.set('trust proxy', 1);

// Configure session with MongoStore for database session backing
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions',
    ttl: 8 * 60 * 60 // 8 hours
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

/* ─── MULTER (memory upload) ─────────────── */
const storage = multer.memoryStorage();
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

/* ─── DYNAMIC UPLOADS SERVING ────────────── */
app.get('/uploads/:filename', async (req, res) => {
  try {
    const file = await Media.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).send('File not found');
    }
    res.set('Content-Type', file.contentType);
    res.send(file.data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* ════════════════════════════════════════════
   PUBLIC API — used by portfolio frontend
   ════════════════════════════════════════════ */

// Helper to reorder items based on chosen position
async function reorderItems(Model, itemId, position, customPos) {
  const items = await Model.find({}).sort({ sort_order: 1, _id: 1 });
  const targetIndex = items.findIndex(item => item._id.toString() === itemId.toString());
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

  for (let idx = 0; idx < items.length; idx++) {
    items[idx].sort_order = idx + 1;
    await items[idx].save();
  }
}

// GET /api/skills — all skills
app.get('/api/skills', async (req, res) => {
  try {
    const skills = await Skill.find({}).sort({ sort_order: 1, name: 1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/education — all education & background items
app.get('/api/education', async (req, res) => {
  try {
    const education = await Education.find({}).sort({ sort_order: 1, title: 1 });
    const parsed = education.map(e => {
      const plain = e.toObject();
      return {
        ...plain,
        tags: plain.tags ? plain.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
    });
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects — all projects for the public portfolio
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ is_pinned: -1, created_at: -1 });
    const parsed = projects.map(p => {
      const plain = p.toObject();
      return {
        ...plain,
        tags: plain.tags ? plain.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
    });
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id — single project detail
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    const plain = project.toObject();
    plain.tags = plain.tags ? plain.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    res.json(plain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find({}).sort({ sort_order: 1, date: -1 });
    res.json(certificates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activities
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await Activity.find({}).sort({ sort_order: 1, date: -1 });
    const parsed = activities.map(a => {
      const plain = a.toObject();
      return {
        ...plain,
        image_urls: plain.image_urls ? plain.image_urls.split(',').map(u => u.trim()).filter(Boolean) : [],
        certificates: plain.certificates ? plain.certificates.split(',').map(c => c.trim()).filter(Boolean) : []
      };
    });
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upcoming
app.get('/api/upcoming', async (req, res) => {
  try {
    const upcoming = await UpcomingProject.find({}).sort({ sort_order: 1, expected_date: 1 });
    const parsed = upcoming.map(u => {
      const plain = u.toObject();
      return {
        ...plain,
        tech_stack: plain.tech_stack ? plain.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : []
      };
    });
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/partners
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await Partner.find({}).sort({ sort_order: 1, name: 1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resume
app.get('/api/resume', async (req, res) => {
  try {
    const row = await Setting.findOne({ key: 'resume_url' });
    res.json({ url: row ? row.value : '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ sort_order: 1, created_at: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/socials
app.get('/api/socials', async (req, res) => {
  try {
    const socials = await Social.find({}).sort({ sort_order: 1 });
    res.json(socials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages — submit contact form message
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    await Message.create({ name, email, message, ip });
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
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.json({ success: false, message: 'Invalid username or password.' });
    }
    req.session.admin = { id: admin._id.toString(), username: admin.username };
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
app.get('/admin/api/projects', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ is_pinned: -1, created_at: -1 });
    res.json(projects.map(p => {
      const plain = p.toObject();
      return {
        ...plain,
        tags: plain.tags ? plain.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/projects — create
app.post('/admin/api/projects', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), async (req, res) => {
  try {
    const { title, description, full_desc, emoji, tags, github_url, linkedin_url, team, gradient, is_pinned } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required.' });

    let image_url = '';
    if (req.files && req.files.image) {
      image_url = await saveFile(req.files.image[0]);
    }

    let gallery_urls = '';
    if (req.files && req.files.gallery) {
      const saved = await Promise.all(req.files.gallery.map(saveFile));
      gallery_urls = saved.filter(Boolean).join(',');
    }

    const pinned = is_pinned === 'true' || is_pinned === '1' ? 1 : 0;
    const newProj = await Project.create({
      title,
      description,
      full_desc: full_desc || '',
      emoji: emoji || '🚀',
      image_url,
      tags: tags || '',
      github_url: github_url || '',
      linkedin_url: linkedin_url || '',
      team: team || '',
      gradient: gradient || 'linear-gradient(135deg,#1a1a2e,#16213e)',
      is_pinned: pinned,
      gallery_urls
    });

    res.json({ success: true, id: newProj._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/projects/:id — update
app.put('/admin/api/projects/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), async (req, res) => {
  try {
    const { title, description, full_desc, emoji, tags, github_url, linkedin_url, team, gradient, is_pinned } = req.body;
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    let image_url = existing.image_url;
    if (req.files && req.files.image) {
      await deleteFile(existing.image_url);
      image_url = await saveFile(req.files.image[0]);
    }

    let gallery_urls = existing.gallery_urls || '';
    if (req.files && req.files.gallery) {
      const saved = await Promise.all(req.files.gallery.map(saveFile));
      const newUrls = saved.filter(Boolean).join(',');
      gallery_urls = gallery_urls ? gallery_urls + ',' + newUrls : newUrls;
    }
    const pinned = is_pinned === 'true' || is_pinned === '1' ? 1 : 0;

    existing.title = title;
    existing.description = description;
    existing.full_desc = full_desc || '';
    existing.emoji = emoji || '🚀';
    existing.image_url = image_url;
    existing.tags = tags || '';
    existing.github_url = github_url || '';
    existing.linkedin_url = linkedin_url || '';
    existing.team = team || '';
    existing.gradient = gradient || existing.gradient;
    existing.is_pinned = pinned;
    existing.gallery_urls = gallery_urls;

    await existing.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/projects/:id
app.delete('/admin/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await deleteFile(existing.image_url);
    if (existing.gallery_urls) {
      await Promise.all(existing.gallery_urls.split(',').filter(Boolean).map(deleteFile));
    }

    await Project.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── CERTIFICATES ADMIN CRUD ─── */

// GET /admin/api/certificates
app.get('/admin/api/certificates', requireAuth, async (req, res) => {
  try {
    const certs = await Certificate.find({}).sort({ sort_order: 1, date: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/certificates
app.post('/admin/api/certificates', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, issuer, date, credential_url, sort_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    let image_url = '';
    if (req.files && req.files.image) {
      image_url = await saveFile(req.files.image[0]);
    }

    const order = parseInt(sort_order, 10) || 0;
    await Certificate.create({
      title,
      issuer: issuer || '',
      date: date || '',
      image_url,
      credential_url: credential_url || '',
      sort_order: order
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/certificates/:id
app.put('/admin/api/certificates/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, issuer, date, credential_url, sort_order } = req.body;
    const existing = await Certificate.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });

    let image_url = existing.image_url;
    if (req.files && req.files.image) {
      await deleteFile(existing.image_url);
      image_url = await saveFile(req.files.image[0]);
    }

    const order = parseInt(sort_order, 10) || 0;
    existing.title = title;
    existing.issuer = issuer || '';
    existing.date = date || '';
    existing.image_url = image_url;
    existing.credential_url = credential_url || '';
    existing.sort_order = order;

    await existing.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/certificates/:id
app.delete('/admin/api/certificates/:id', requireAuth, async (req, res) => {
  try {
    const existing = await Certificate.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });

    await deleteFile(existing.image_url);
    await Certificate.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── ACTIVITIES ADMIN CRUD ─── */

// GET /admin/api/activities
app.get('/admin/api/activities', requireAuth, async (req, res) => {
  try {
    res.json(await Activity.find({}).sort({ sort_order: 1, date: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/activities
app.post('/admin/api/activities', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), async (req, res) => {
  try {
    const { title, description, certificates, date, category, sort_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    let image_url = '';
    if (req.files && req.files.image) {
      image_url = await saveFile(req.files.image[0]);
    }

    let newGallery = '';
    if (req.files && req.files.gallery) {
      const saved = await Promise.all(req.files.gallery.map(saveFile));
      newGallery = saved.filter(Boolean).join(',');
    }

    const image_urls = image_url ? (newGallery ? image_url + ',' + newGallery : image_url) : newGallery;
    const order = parseInt(sort_order, 10) || 0;

    await Activity.create({
      title,
      description: description || '',
      image_urls,
      certificates: certificates || '',
      date: date || '',
      category: category || '',
      sort_order: order
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/activities/:id
app.put('/admin/api/activities/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), async (req, res) => {
  try {
    const { title, description, certificates, date, category, sort_order } = req.body;
    const existing = await Activity.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });

    let currentUrls = existing.image_urls || '';
    if (req.files && req.files.image) {
      const newCover = await saveFile(req.files.image[0]);
      const parts = currentUrls.split(',').filter(Boolean);
      if (parts.length > 0) {
        await deleteFile(parts[0]);
        parts[0] = newCover;
      } else {
        parts.push(newCover);
      }
      currentUrls = parts.join(',');
    }

    if (req.files && req.files.gallery) {
      const saved = await Promise.all(req.files.gallery.map(saveFile));
      const newGals = saved.filter(Boolean).join(',');
      currentUrls = currentUrls ? currentUrls + ',' + newGals : newGals;
    }

    const order = parseInt(sort_order, 10) || 0;
    existing.title = title;
    existing.description = description || '';
    existing.image_urls = currentUrls;
    existing.certificates = certificates || '';
    existing.date = date || '';
    existing.category = category || '';
    existing.sort_order = order;

    await existing.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/activities/:id
app.delete('/admin/api/activities/:id', requireAuth, async (req, res) => {
  try {
    const existing = await Activity.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });

    if (existing.image_urls) {
      await Promise.all(existing.image_urls.split(',').filter(Boolean).map(deleteFile));
    }

    await Activity.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── UPCOMING PROJECTS ADMIN CRUD ─── */

// GET /admin/api/upcoming
app.get('/admin/api/upcoming', requireAuth, async (req, res) => {
  try {
    res.json(await UpcomingProject.find({}).sort({ sort_order: 1, expected_date: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/upcoming
app.post('/admin/api/upcoming', requireAuth, async (req, res) => {
  try {
    const { title, description, expected_date, status, tech_stack, sort_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    const order = parseInt(sort_order, 10) || 0;

    await UpcomingProject.create({
      title,
      description: description || '',
      expected_date: expected_date || '',
      status: status || 'planning',
      tech_stack: tech_stack || '',
      sort_order: order
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/upcoming/:id
app.put('/admin/api/upcoming/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, expected_date, status, tech_stack, sort_order } = req.body;
    const existing = await UpcomingProject.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    const order = parseInt(sort_order, 10) || 0;

    existing.title = title;
    existing.description = description || '';
    existing.expected_date = expected_date || '';
    existing.status = status || 'planning';
    existing.tech_stack = tech_stack || '';
    existing.sort_order = order;

    await existing.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/upcoming/:id
app.delete('/admin/api/upcoming/:id', requireAuth, async (req, res) => {
  try {
    await UpcomingProject.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── PARTNERS ADMIN CRUD ─── */

// GET /admin/api/partners
app.get('/admin/api/partners', requireAuth, async (req, res) => {
  try {
    res.json(await Partner.find({}).sort({ sort_order: 1, name: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/partners
app.post('/admin/api/partners', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, role, link, bio, sort_order } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Name and role are required.' });

    let image_url = '';
    if (req.files && req.files.image) {
      image_url = await saveFile(req.files.image[0]);
    }

    const order = parseInt(sort_order, 10) || 0;
    await Partner.create({
      name,
      role,
      image_url,
      link: link || '',
      bio: bio || '',
      sort_order: order
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/partners/:id
app.put('/admin/api/partners/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, role, link, bio, sort_order } = req.body;
    const existing = await Partner.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });

    let image_url = existing.image_url;
    if (req.files && req.files.image) {
      await deleteFile(existing.image_url);
      image_url = await saveFile(req.files.image[0]);
    }

    const order = parseInt(sort_order, 10) || 0;
    existing.name = name;
    existing.role = role;
    existing.image_url = image_url;
    existing.link = link || '';
    existing.bio = bio || '';
    existing.sort_order = order;

    await existing.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/partners/:id
app.delete('/admin/api/partners/:id', requireAuth, async (req, res) => {
  try {
    const existing = await Partner.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found.' });

    await deleteFile(existing.image_url);
    await Partner.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── BLOGS ADMIN CRUD ─── */
app.get('/admin/api/blogs', requireAuth, async (req, res) => {
  try {
    res.json(await Blog.find({}).sort({ sort_order: 1, created_at: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/api/blogs', requireAuth, async (req, res) => {
  try {
    const { title, description, link, platform, sort_order } = req.body;
    if (!title || !link) return res.status(400).json({ error: 'Title and link are required.' });
    const order = parseInt(sort_order, 10) || 0;

    await Blog.create({
      title,
      description: description || '',
      link,
      platform: platform || 'Medium',
      sort_order: order
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/api/blogs/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, link, platform, sort_order } = req.body;
    if (!title || !link) return res.status(400).json({ error: 'Title and link are required.' });
    const existing = await Blog.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Blog not found.' });

    const order = parseInt(sort_order, 10) || 0;
    existing.title = title;
    existing.description = description || '';
    existing.link = link;
    existing.platform = platform || 'Medium';
    existing.sort_order = order;

    await existing.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/api/blogs/:id', requireAuth, async (req, res) => {
  try {
    await Blog.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── SOCIALS ADMIN CRUD ─── */
app.get('/admin/api/socials', requireAuth, async (req, res) => {
  try {
    res.json(await Social.find({}).sort({ sort_order: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/api/socials', requireAuth, async (req, res) => {
  try {
    const { name, url, sort_order } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and URL are required.' });
    const order = parseInt(sort_order, 10) || 0;

    await Social.create({
      name,
      url,
      sort_order: order
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/api/socials/:id', requireAuth, async (req, res) => {
  try {
    const { name, url, sort_order } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and URL are required.' });
    const existing = await Social.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Social link not found.' });

    const order = parseInt(sort_order, 10) || 0;
    existing.name = name;
    existing.url = url;
    existing.sort_order = order;

    await existing.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/api/socials/:id', requireAuth, async (req, res) => {
  try {
    await Social.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── MESSAGES ADMIN API ─── */

// GET /admin/api/messages
app.get('/admin/api/messages', requireAuth, async (req, res) => {
  try {
    res.json(await Message.find({}).sort({ created_at: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/messages/:id/read
app.put('/admin/api/messages/:id/read', requireAuth, async (req, res) => {
  try {
    await Message.updateOne({ _id: req.params.id }, { is_read: 1 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/messages/:id
app.delete('/admin/api/messages/:id', requireAuth, async (req, res) => {
  try {
    await Message.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── SKILLS ADMIN CRUD ─── */

// GET /admin/api/skills
app.get('/admin/api/skills', requireAuth, async (req, res) => {
  try {
    res.json(await Skill.find({}).sort({ sort_order: 1, name: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/skills
app.post('/admin/api/skills', requireAuth, async (req, res) => {
  try {
    const { name, position, custom_pos } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name is required.' });

    const newSkill = await Skill.create({ name, sort_order: 999999 });
    await reorderItems(Skill, newSkill._id, position, custom_pos);

    res.json({ success: true, id: newSkill._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/skills/:id
app.put('/admin/api/skills/:id', requireAuth, async (req, res) => {
  try {
    const { name, position, custom_pos } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name is required.' });

    const existing = await Skill.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Skill not found.' });

    existing.name = name;
    await existing.save();

    await reorderItems(Skill, existing._id, position, custom_pos);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/skills/:id
app.delete('/admin/api/skills/:id', requireAuth, async (req, res) => {
  try {
    const existing = await Skill.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Skill not found.' });

    await Skill.deleteOne({ _id: req.params.id });

    // Compact remaining sort_orders
    const items = await Skill.find({}).sort({ sort_order: 1, _id: 1 });
    for (let idx = 0; idx < items.length; idx++) {
      items[idx].sort_order = idx + 1;
      await items[idx].save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── EDUCATION ADMIN CRUD ─── */

// GET /admin/api/education
app.get('/admin/api/education', requireAuth, async (req, res) => {
  try {
    res.json(await Education.find({}).sort({ sort_order: 1, title: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/education
app.post('/admin/api/education', requireAuth, async (req, res) => {
  try {
    const { icon, title, subtitle, institution, date_range, tags, position, custom_pos } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const newEdu = await Education.create({
      icon: icon || '🎓',
      title,
      subtitle: subtitle || '',
      institution: institution || '',
      date_range: date_range || '',
      tags: tags || '',
      sort_order: 999999
    });

    await reorderItems(Education, newEdu._id, position, custom_pos);
    res.json({ success: true, id: newEdu._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/api/education/:id
app.put('/admin/api/education/:id', requireAuth, async (req, res) => {
  try {
    const { icon, title, subtitle, institution, date_range, tags, position, custom_pos } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const existing = await Education.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Education entry not found.' });

    existing.icon = icon || '🎓';
    existing.title = title;
    existing.subtitle = subtitle || '';
    existing.institution = institution || '';
    existing.date_range = date_range || '';
    existing.tags = tags || '';

    await existing.save();

    await reorderItems(Education, existing._id, position, custom_pos);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/api/education/:id
app.delete('/admin/api/education/:id', requireAuth, async (req, res) => {
  try {
    const existing = await Education.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Education entry not found.' });

    await Education.deleteOne({ _id: req.params.id });

    // Compact remaining sort_orders
    const items = await Education.find({}).sort({ sort_order: 1, _id: 1 });
    for (let idx = 0; idx < items.length; idx++) {
      items[idx].sort_order = idx + 1;
      await items[idx].save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── RESUME ADMIN API ─── */

// POST /admin/api/resume
app.post('/admin/api/resume', requireAuth, upload.fields([{ name: 'resume', maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const currentResume = await Setting.findOne({ key: 'resume_url' });
    if (currentResume && currentResume.value) {
      await deleteFile(currentResume.value);
    }
    const resumeUrl = await saveFile(req.files.resume[0]);
    await Setting.updateOne({ key: 'resume_url' }, { value: resumeUrl }, { upsert: true });
    res.json({ success: true, url: resumeUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/change-password
app.post('/admin/api/change-password', requireAuth, async (req, res) => {
  try {
    const { current, newpass, confirm } = req.body;
    if (newpass !== confirm) return res.json({ success: false, message: 'New passwords do not match.' });
    if (newpass.length < 6) return res.json({ success: false, message: 'Password must be at least 6 characters.' });

    const admin = await Admin.findById(req.session.admin.id);
    if (!bcrypt.compareSync(current, admin.password)) {
      return res.json({ success: false, message: 'Current password is incorrect.' });
    }

    const hash = bcrypt.hashSync(newpass, 10);
    admin.password = hash;
    await admin.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/api/change-username
app.post('/admin/api/change-username', requireAuth, async (req, res) => {
  try {
    const { newUsername, password } = req.body;
    if (!newUsername || newUsername.trim() === '') return res.json({ success: false, message: 'New username cannot be empty.' });

    const admin = await Admin.findById(req.session.admin.id);
    if (!bcrypt.compareSync(password, admin.password)) {
      return res.json({ success: false, message: 'Password is incorrect.' });
    }

    admin.username = newUsername.trim();
    await admin.save();
    req.session.admin.username = newUsername.trim();
    res.json({ success: true, message: 'Username updated successfully.' });
  } catch (err) {
    res.json({ success: false, message: 'Error updating username.' });
  }
});

/* ─── ERROR HANDLER ───────────────────────── */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size limit exceeded. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

/* ─── CATCH-ALL → portfolio ─────────────── */
app.get(['/', '/login', '/admin'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* ─── START ──────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  Portfolio running at → http://localhost:${PORT}`);
  console.log(`🔒  Admin panel         → http://localhost:${PORT}/admin`);
  console.log(`🔑  Login credentials   → Configured via ADMIN_EMAIL and ADMIN_PASSWORD environment variables\n`);
});
