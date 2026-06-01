# 🌱 Shivam Mishra — AI Developer Portfolio (v2)

A premium, high-fidelity personal portfolio and content management application designed to showcase technical expertise, projects, academic background, and publications. This application features a unified frontend user interface combined with a secure, full-stack administration console to manage all portfolio data dynamically in real time.

---

## 🌟 Key Features

### 1. High-Fidelity User Experience
- **Sleek Glassmorphism Design**: Custom dark-mode theme utilizing refined backdrop blur filters, custom glow effects, and modern CSS gradients.
- **Interactive Connections Canvas**: A dynamic connection net background rendered using HTML5 Canvas, mapping and connecting node coordinates relative to mouse distance.
- **Card Tilt Micro-Animations**: Custom mouse-tilt animations calculated via cursor coordinates to dynamically rotate and lift showcase elements.
- **Client-Side Router**: Fast, responsive Single Page Application (SPA) layout containing smooth section switching and route navigation.

### 2. Secure Admin Console
- **Projects Manager**: Create, edit, delete, and pin key projects. Customize gradients, description fields, links, and icons.
- **Academic & Professional Timelines**: Log education, background details, certifications, and technical skills.
- **Activities & Hackathons**: Log contest details, categories, dates, and attach rich image galleries.
- **Messages Inbox**: Access and manage visitor inquiries sent via the contact form, featuring IP address logging and status tracking.
- **Administrative Controls**: Secure username, password, and PDF resume updates.

### 3. Server Architecture
- **Zero-State Filesystem**: All uploaded media (such as resumes, certificates, and project covers) are converted to binary data (`Buffer`) and stored directly within the MongoDB database. The server retrieves and streams files dynamically, allowing the application to run seamlessly in stateless environments.
- **Session Persistence**: Node.js session authentication is persisted directly in MongoDB using a database-backed session store, preventing administrative logout events during server restarts.

---

## 🛠️ Technology Stack

The application is built using modern, fast, and lightweight open-source technologies:

### Backend
- **Core Environment**: [Node.js](https://nodejs.org) (v18+)
- **Server Framework**: [Express](https://expressjs.com) (HTTP server and RESTful router)
- **Object Modeling**: [Mongoose](https://mongoosejs.com) (MongoDB ODM)
- **Authentication**: [Express Session](https://github.com/expressjs/session) with secure sessions
- **Session Storage**: [Connect Mongo](https://github.com/jaredhanson/connect-mongo) (database session serializer)
- **Encryption**: [BcryptJS](https://github.com/dcode/bcryptjs) (secure salted password hashing)
- **File Upload Engine**: [Multer](https://github.com/expressjs/multer) (configured for in-memory file buffers)
- **Configuration**: [Dotenv](https://github.com/motdotla/dotenv) (local environment loader)

### Frontend
- **Structure**: Vanilla HTML5
- **Styling**: Vanilla CSS3 (Custom animations, Syne/Space Mono typography, variables, responsive breakpoints)
- **Interactions**: Pure Vanilla JavaScript (Client-side router, scroll reveal triggers, 2D particle canvas, dynamic modal handlers, AJAX endpoints)

---

## 🔐 Security & Hardening

This application incorporates industry-standard security practices to safeguard administrator portals and user information:

- **Strict Environment Checks**: Verifies required database, session, and credential parameters on boot, terminating immediately with a clear logging warning if configurations are missing.
- **Proxy Handling**: Express is configured to trust reverse proxies (`trust proxy`), ensuring secure headers and client IP logging function correctly behind load balancers.
- **Session Cookie Hardening**: Cookies are configured with `httpOnly: true` (prevents cross-site scripting/XSS cookie theft), `secure: true` in production (enforces HTTPS transmission), and `sameSite: 'lax'` (guards against CSRF attacks).
- **Password Salting**: Admin credentials are encrypted and stored using salted Bcrypt hashes.
- **File Size Constraints**: Restricts multi-part uploads to a maximum file size of 5MB, preventing document buffer overflows.

---

Built with 💙 by **Shivam Mishra**
