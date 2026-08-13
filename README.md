# 💈☕ Tamil Deluxe Saloon (தமிழ் டீ கடை & சலூன் 90s/2000s Hits)

A production-ready, highly aesthetic nostalgic Tamil radio & saloon web application inspired by `saloon.wtf`. Bringing back the gold standard of 90s & 2000s Kollywood barber shop cassette hits, tea kadai melodies, and gaana specials into a continuous 24/7 web radio experience.

![Tamil Deluxe Saloon Preview](https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=1200&q=80)

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
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tamil-deluxe-saloon-super-secret-jwt-key-90s-hits"
ADMIN_INITIAL_PASSWORD="saloon123"
```

### 3. Initialize & Seed Database
```bash
npx prisma db push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Main Radio Page**: `http://localhost:3000`
- **Admin Dashboard**: `http://localhost:3000/admin/dashboard`
- **Default Admin Login**: Username: `admin` | Password: `saloon123`

---

## 🌐 $0 Hosting & Deployment Guide

### Deploying to Vercel (Recommended)
1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import your `tamil-deluxe-saloon` repository.
4. Set Environment Variables in Vercel:
   - `JWT_SECRET`: (Random secure string)
   - `ADMIN_INITIAL_PASSWORD`: (Your desired admin password)
5. Deploy! Vercel automatically builds and provides free SSL and global CDN.

---

## 📜 License
MIT License. Created with ❤️ for 90s & 2000s Kollywood Nostalgia lovers.
