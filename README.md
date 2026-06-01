# 🌱 Shivam Mishra — AI Developer Portfolio (v2)

A premium, dynamic, and full-stack personal portfolio application built with a lightweight and fast Node.js + Express backend, MongoDB database (via Mongoose), and vanilla HTML/CSS/JS frontend featuring a high-fidelity glassmorphism design, custom particle connection backgrounds, mouse-tilt cursor animations, and a secure CRUD Admin Console.

---

## 📁 Project Structure

The project is structured to make hosting and deployment extremely easy, featuring a unified single-page application (SPA) client-side routing layout:

```text
portfolio-v2/
├── server.js              ← The Backend (Express server, Mongoose models, session auth, DB-backed media serving)
├── package.json           ← Node dependencies and startup scripts
├── package-lock.json      
├── .gitignore             ← Excludes node_modules and local .env configurations from Git
├── .env                   ← Local environment variables (DB URLs, admin email/password, session secrets)
└── public/                ← Static server folder
    ├── index.html         ← The Frontend (Unified SPA: public portfolio, admin login, and CRUD panel)
    ├── groot_logo.png     
    └── profile.jpeg       
```

---

## 🚀 Setup & Run

### 1. Requirements
Ensure you have **Node.js** (v18+) and a **MongoDB** database instance (either running locally or a free cluster on MongoDB Atlas).

### 2. Install Dependencies
Navigate to the root directory and run:
```bash
npm install
```

### 3. Local Environment Variables
Create a file named `.env` in the root directory (this is already ignored by Git) and add the following template:
```env
# MongoDB Connection String (Replace <db_username> and <db_password> with your details)
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.lkoxldo.mongodb.net/portfolio?retryWrites=true&w=majority

# App Configurations
PORT=3000
SESSION_SECRET=groot-is-groot-secret-key-2025
ADMIN_EMAIL=Shivamwork321@gmail.com
ADMIN_PASSWORD=<your_admin_password>
```

### 4. Running the Application
- **Production Mode**:
  ```bash
  npm start
  ```
- **Development Mode** (with hot-reloading via nodemon):
  ```bash
  npm run dev
  ```

### 5. Ports & Access
Once started, the application is accessible at:
- **Public Portfolio** → `http://localhost:3000`
- **Admin Panel** → `http://localhost:3000/admin` (redirects to `/login` if not authenticated)

---

## 🗄️ Database & Schema

The application uses **MongoDB** as its primary store. On startup, the server automatically connects, establishes the schemas, and seeds default portfolio sections and administrator configurations if the database is empty.

### Collections list:

1. **`Admin`**: Stores credentials for backend authentication.
2. **`Project`**: Primary portfolio projects with gradient configurations, tags, emojis, and detail fields.
3. **`Certificate`**: Course certifications, issuer info, and verification URLs.
4. **`Activity`**: Hackathons, coding contests, and extracurricular activities.
5. **`UpcomingProject`**: Pipeline tracking with status tags (`planning`, `in-progress`, `coming-soon`).
6. **`Partner`**: Project collaborators, roles, and profile URLs.
7. **`Message`**: Visitor queries sent via the contact form, including their IP address for security.
8. **`Setting`**: Key-value metadata storage (e.g. stores the `resume_url` path dynamically).
9. **`Skill`**: Custom technology tags shown in the Skills section.
10. **`Education`**: Timelines, institutions, date ranges, and academic tags.
11. **`Blog`**: Articles dynamically fetched and grouped by publication platform.
12. **`Social`**: Links to social accounts mapped to brand icons on the client interface.
13. **`Media`**: Dynamic database-backed files storing uploaded badges, project covers, and resumes as binary data (`Buffer`).

---

## 💾 Zero-Disk File Uploads

All uploaded files (such as resume PDFs and project/badge images) are stored directly inside the **MongoDB `Media` collection** as binary buffers instead of being saved on the local disk filesystem.
- When an administrator uploads a file via the Admin Dashboard, the server saves the file binary directly in MongoDB and generates a route path like `/uploads/:filename`.
- When visitors load your site, the Express server retrieves the file from MongoDB and streams it directly to the browser with the correct MIME type.
- **This design allows the entire application to be 100% database-backed, running perfectly on Render's free tier with zero data loss or need for expensive persistent volumes.**

---

## 🌐 Public REST API

The frontend interacts with the backend using the following public JSON endpoints:

| Endpoint | Method | Response Description |
|---|---|---|
| `/api/projects` | `GET` | Array of all projects (sorted by pinned state, then date). |
| `/api/projects/:id` | `GET` | Full single project metadata (for modal display). |
| `/api/skills` | `GET` | Array of skills (sorted by display order). |
| `/api/education` | `GET` | Array of background items (sorted by display order). |
| `/api/upcoming` | `GET` | Future roadmap projects (sorted by display order). |
| `/api/activities` | `GET` | Extracurricular items, hackathons, and images. |
| `/api/certificates` | `GET` | Listed certifications and badge image URLs. |
| `/api/partners` | `GET` | Collaborator profiles, roles, and links. |
| `/api/blogs` | `GET` | Dynamic technical articles. |
| `/api/socials` | `GET` | Social platform profiles and links. |
| `/api/resume` | `GET` | JSON containing the active resume PDF path. |
| `/api/messages` | `POST` | Submit a direct contact query from the visitor. |

---

## 🛠️ Secure Admin Dashboard API

All dashboard endpoints require the user to have an active session established via the `requireAuth` middleware. Session data is stored securely in MongoDB using `connect-mongo`.

### Project CRUD
- `GET /admin/api/projects` — Fetch all projects.
- `POST /admin/api/projects` — Create project with cover image and optional gallery.
- `PUT /admin/api/projects/:id` — Update project metadata, changing pinned states and re-uploading images.
- `DELETE /admin/api/projects/:id` — Delete project and remove related uploads from MongoDB.

### Additional CRUDs (Certificates, Activities, Partners, Upcoming, Skills, Education, Blogs, Socials)
Each has standard REST handlers matching the fields in the schema:
- `GET /admin/api/[section]` — List all records.
- `POST /admin/api/[section]` — Create new record (supports position reordering parameters `top`, `middle`, `bottom`, `custom`).
- `PUT /admin/api/[section]/:id` — Update existing record.
- `DELETE /admin/api/[section]/:id` — Remove record and clean up associated media files in database.

### Administrative Controls
- `GET /admin/api/messages` — Review all messages left by visitors.
- `PUT /admin/api/messages/:id/read` — Toggle a message's read status.
- `DELETE /admin/api/messages/:id` — Remove message.
- `POST /admin/api/resume` — Upload new resume PDF (updates `resume_url` in settings table).
- `POST /admin/api/change-username` — Securely update credentials.
- `POST /admin/api/change-password` — Securely update current password using bcrypt hashing verification.

---

## 🎨 User Interface & Styling Details

The interface relies on premium dark modes, harmony colors, and responsive design systems.

- **Theme Palette**: Deep Dark Blue (`#04080f`), Rich Glassmorphism (`rgba(255,255,255,0.055)`), Vibrant Pink (`#f72585`), Crimson (`#e63946`).
- **Typography**: Display Headers use `Syne`, tech badges and console logs use `Space Mono`.
- **Canvas Connection Network**: An interactive, dynamic particle net background is rendered using JavaScript `canvas2d` mapping node connections within 110px.
- **Scroll Reveal**: Uses standard `IntersectionObserver` configurations in `public/script.js` to animate grid items as they enter the screen viewport.
- **Mouse Tilt Micro-animations**: Moving the cursor over the showcase cards calculates relative cursor coordinates to dynamically tilt cards (`rotateX` / `rotateY`) and raise elevation.
- **Scrollability Support**: The admin panel sidebar and forms automatically adjust to use custom scrollbars on lower vertical heights to prevent navigation cutting.

---

## ☁️ Deployment Guide (Render + MongoDB Atlas)

This application runs flawlessly on **Render's Free Tier** because all storage requirements (database records + media uploads) are handled remotely by **MongoDB Atlas**.

### Step 1: Create a Free MongoDB Atlas Database
1. Sign up for free at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Deploy a new cluster on the **M0 (Free)** tier.
3. Add a Database User (save the username and password securely).
4. Under **Network Access**, add `0.0.0.0/0` (allow connections from anywhere) so Render can connect to it.
5. In **Database** -> click **Connect** -> select **Drivers** (Node.js). Copy the connection string.

### Step 2: Create Web Service on Render
1. Go to [Render](https://render.com) and log in.
2. Click **New +** -> **Web Service**.
3. Connect your repository `shivamishra12/Portfolio` and click **Connect**.
4. Configure basic settings:
   - **Name**: `shivam-portfolio`
   - **Region**: Select your preferred region.
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Select **Free**.

### Step 3: Configure Environment Variables
In the **Environment** tab, add the following environment variables:
- `MONGODB_URI` = `mongodb+srv://<db_username>:<db_password>@cluster.mongodb.net/portfolio?retryWrites=true&w=majority` *(your MongoDB Atlas connection string)*
- `ADMIN_EMAIL` = `Shivamwork321@gmail.com` *(login email for dashboard)*
- `ADMIN_PASSWORD` = `<your_admin_password>` *(login password for dashboard)*
- `SESSION_SECRET` = `groot-is-groot-secret-key-2025`

### Step 4: Deploy & Verify
1. Click **Create Web Service**.
2. Render will build and deploy your app.
3. Access your site, go to `/login`, and upload your resume/images. Everything will persist forever in MongoDB Atlas!

---

Built with 💙 by **Shivam Kumar**
