# 🌱 Shivam Mishra — AI Developer Portfolio (v2)

A premium, dynamic, and full-stack personal portfolio application built with a lightweight and fast Node.js + Express backend, MongoDB database (via Mongoose), and vanilla HTML/CSS/JS frontend featuring a high-fidelity glassmorphism design, custom particle connection backgrounds, mouse-tilt cursor animations, and a secure CRUD Admin Console.

---

## 📁 Project Structure

```text
portfolio-v2/
├── server.js              ← Express server, Mongoose models, session auth, DB-backed media serving
├── package.json           ← Node dependencies and startup scripts
├── package-lock.json
├── .gitignore             ← Excludes node_modules and local .env configurations from Git
├── .env                   ← Local environment variables (NOT committed to Git)
└── public/
    ├── index.html         ← Unified SPA frontend
    ├── groot_logo.png
    └── profile.jpeg
```

---

# 🚀 Setup & Run

## 1. Requirements

Ensure you have:

* Node.js v18+
* MongoDB Atlas account (or local MongoDB instance)

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Create Environment Variables

Create a file named `.env` in the project root:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster.mongodb.net/portfolio?retryWrites=true&w=majority

# Application Configuration
PORT=3000

# Authentication
ADMIN_EMAIL=<your_admin_email>
ADMIN_PASSWORD=<your_admin_password>

# Session Security
SESSION_SECRET=<your_secure_random_session_secret>

# Environment
NODE_ENV=development

# Database Seeding
ENABLE_SEEDING=true
```

> ⚠️ Never commit the `.env` file to GitHub.

---

## 4. Run the Application

### Production Mode

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

---

## 5. Access the Application

Public Portfolio:

```text
http://localhost:3000
```

Admin Panel:

```text
http://localhost:3000/admin
```

---

# 🗄️ Database Architecture

The application uses MongoDB as the primary database and automatically creates collections on startup.

### Collections

* Admin
* Project
* Certificate
* Activity
* UpcomingProject
* Partner
* Message
* Setting
* Skill
* Education
* Blog
* Social
* Media

---

# 💾 Database-Backed File Storage

All uploaded files are stored directly inside MongoDB.

Supported uploads:

* Resume PDFs
* Project Images
* Certificate Images
* Activity Images
* Partner Images

Benefits:

* No dependency on Render's filesystem
* No data loss after redeployments
* No persistent disk required
* Compatible with Render Free Tier

Uploaded files are served through:

```text
/uploads/:filename
```

---

# 🌐 Public API

| Endpoint            | Method | Description            |
| ------------------- | ------ | ---------------------- |
| `/api/projects`     | GET    | List all projects      |
| `/api/projects/:id` | GET    | Get single project     |
| `/api/skills`       | GET    | List skills            |
| `/api/education`    | GET    | List education items   |
| `/api/upcoming`     | GET    | List upcoming projects |
| `/api/activities`   | GET    | List activities        |
| `/api/certificates` | GET    | List certificates      |
| `/api/partners`     | GET    | List partners          |
| `/api/blogs`        | GET    | List blogs             |
| `/api/socials`      | GET    | List social links      |
| `/api/resume`       | GET    | Get current resume     |
| `/api/messages`     | POST   | Submit contact form    |

---

# 🔐 Admin Dashboard

All admin routes require authentication and are protected by session-based authorization.

### Features

* Project Management
* Certificate Management
* Activity Management
* Partner Management
* Blog Management
* Skills Management
* Education Management
* Resume Upload
* Contact Message Review
* Change Username
* Change Password

Sessions are securely stored in MongoDB using `connect-mongo`.

---

# 🛡️ Security Features

### Environment Validation

The server refuses to start if any required environment variable is missing:

* MONGODB_URI
* SESSION_SECRET
* ADMIN_EMAIL
* ADMIN_PASSWORD

### Session Security

* HTTP-only cookies
* Secure cookies in production
* SameSite protection
* MongoDB-backed sessions

### Upload Security

* Maximum upload size: 5MB
* Images and PDFs only
* Database-backed storage
* Automatic media cleanup on deletion

### Password Security

* Passwords hashed using bcrypt
* No hardcoded credentials
* Session secrets stored in environment variables

---

# ☁️ Deployment Guide (Render + MongoDB Atlas)

## Step 1: Create MongoDB Atlas Cluster

1. Create a free MongoDB Atlas account.
2. Deploy an M0 Free Tier cluster.
3. Create a database user.
4. Configure Network Access:

```text
0.0.0.0/0
```

5. Copy the MongoDB connection string.

---

## Step 2: Deploy on Render

1. Create a new Web Service.
2. Connect your GitHub repository.
3. Configure:

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

---

## Step 3: Configure Render Environment Variables

Add the following variables:

```env
MONGODB_URI=<your_mongodb_connection_string>
ADMIN_EMAIL=<your_admin_email>
ADMIN_PASSWORD=<your_admin_password>
SESSION_SECRET=<your_secure_random_session_secret>
NODE_ENV=production
ENABLE_SEEDING=false
```

### First Deployment

If the database is empty:

```env
ENABLE_SEEDING=true
```

Deploy once.

After the admin account and default data are created:

```env
ENABLE_SEEDING=false
```

Redeploy.

---

## Step 4: Verify Deployment

Check:

* Portfolio loads successfully
* Admin login works
* CRUD operations work
* File uploads work
* Resume download works
* MongoDB collections are created

---

# 📌 Important Security Notes

* Never commit `.env` to GitHub.
* Never publish database credentials.
* Never publish admin credentials.
* Never publish session secrets.
* Rotate credentials immediately if they are accidentally exposed.
* Keep all secrets inside Render Environment Variables or local `.env` files only.

---

Built with 💙 by **Shivam Mishra**
