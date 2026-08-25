# 💈☕ Tamil Deluxe Saloon (தமிழ் டீ கடை & சலூன் 90s/2000s Hits)

A production-ready, highly aesthetic nostalgic Tamil radio & saloon web application inspired by `saloon.wtf`. Bringing back the gold standard of 90s & 2000s Kollywood barber shop cassette hits, tea kadai melodies, and gaana specials into a continuous 24/7 web radio experience.

![Tamil Deluxe Saloon Preview]

---

## ✨ Features & Highlights

### 1. 🎧 Daily Rotational YouTube Audio Engine
- **Hidden YouTube Audio Core**: Completely invisible YouTube Iframe API engine with zero visible YouTube branding or player elements.
- **Glassmorphism Vinyl Player Pill**:
  - Album art spinning vinyl animation (`animate-spin-vinyl` when playing, paused when stopped).
  - Current track title, artist name, interactive seekbar, volume slider, mute toggle, next/previous buttons.
  - Fullscreen dynamic visualizer background with retro tea kadai & saloon ambience.
- **Automated 10-Playlist Daily Rotation**:
  - Automatically selects 1 playlist per day based on calendar day index `(dayOfYear % 10)`.
  - Admin can override the active daily playlist at any time from the dashboard.

### 2. 🔐 Secure Admin Panel (`/admin`)
- Protected admin routes with JWT session cookies (`jose`), password hashing (`bcryptjs`), and API authentication.
- Admin username and password are read from environment variables / Vercel secrets — they are never shown on the login page and are not stored in the repository.
- **10-Playlist Manager**: Add, edit, delete, or reorder playlists.
- **YouTube Metadata Auto-Fetcher**: Fetch playlist titles & cover art previews automatically using YouTube ID.
- **Active Override Manager**: Force set any playlist as today's active station.
- **Monetization & Ad Settings**: Toggle sponsor banners, Google AdSense slots, publisher ID, and custom HTML banner inserts.
- **Site Metadata Manager**: Update top ticker message, base listener count, and social share links.

### 3. 💰 Monetization & Ad Readiness
- Pre-configured ad slots compliant with Google AdSense, EthicalAds, and custom sponsor banners.
- Non-intrusive ad banners placed strategically below player and header to maximize CPM without destroying UX.

### 4. 📻 Live Listener Count & Outbound Links
- Communal presence indicator ("🎧 48 Tamizhans listening live") with green pulsing live dot (`animate-ping bg-green-400`).
- Outbound pill buttons to open current active playlist directly on Spotify and YouTube Music.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Custom Retro Glassmorphism CSS + Lucide Icons
- **Database & ORM**: Prisma ORM with SQLite (Local zero-config `prisma/dev.db`, easily switchable to Vercel Postgres or Supabase)
- **Audio Core**: YouTube Iframe API (`YT.Player`)
- **Auth**: JWT Session Cookies (`jose`) + `bcryptjs`

---

## 🚀 Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/tamil-deluxe-saloon.git
cd tamil-deluxe-saloon
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Then set your own secrets (do not reuse example placeholders):
```env
JWT_SECRET="<generate with: openssl rand -base64 32>"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="<a strong password that is not in git>"
```

`ADMIN_PASSWORD` (or the legacy alias `ADMIN_INITIAL_PASSWORD`) is required. There is no default password, and previously published in-repo defaults are rejected even if set.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Main Radio Page**: `http://localhost:3000`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Admin Login**: use the `ADMIN_USERNAME` / `ADMIN_PASSWORD` values from your local env file or Vercel project settings.

---

## 🌐 $0 Hosting & Deployment Guide

### Deploying to Vercel (Recommended)
1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import your `tamil-deluxe-saloon` repository.
4. Set Environment Variables in Vercel (Project Settings → Environment Variables):
   - `JWT_SECRET`: a long random string (`openssl rand -base64 32`). Required for admin sessions.
   - `ADMIN_USERNAME`: admin username (optional; defaults to `admin`).
   - `ADMIN_PASSWORD`: your admin password. Required. Do not use a value that was ever committed to git.
5. Deploy! Vercel automatically builds and provides free SSL and global CDN.

Admin login will return HTTP 503 until `JWT_SECRET` and `ADMIN_PASSWORD` are set. There is no in-repo fallback password or JWT signing key.

---

## 📜 License
MIT License. Created with ❤️ for 90s & 2000s Kollywood Nostalgia lovers.
