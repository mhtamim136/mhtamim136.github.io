# Murad Hasan Tamim — Portfolio

Modern, polished personal portfolio built with **React 18 + Vite + Tailwind CSS + Framer Motion**.

🌐 **Live**: [mhtamim136.github.io](https://mhtamim136.github.io)

---

## Features

- ⚡ Vite-powered fast dev / build
- 🎨 Dark & light mode with animated circular-reveal transition (View Transitions API)
- 📷 Auto-discovers profile image from `/Image/` folder (no hardcoded filenames)
- 🔄 Projects served from a build-time snapshot (`public/projects.json`, regenerated on build; live GitHub API as fallback)
- 🖼️ Project cards show an automatic image slideshow from each repo's `Project_Card` folder (text-only fallback when a repo has none)
- 📬 Contact form via [Web3Forms](https://web3forms.com) with floating labels, validation, and honeypot spam protection
- 🧩 Language filter chips for projects
- 🎯 Scroll spy navigation with icon-only pill navbar
- 📱 Fully responsive (mobile-first)
- ♿ Accessible — `prefers-reduced-motion`, focus-visible rings, ARIA labels, WCAG AA contrast
- 🖼️ Background grid, gradient blobs, scroll progress bar

## Quick Start

```bash
# 1. Clone
git clone https://github.com/mhtamim136/mhtamim-.git
cd mhtamim-

# 2. Install
npm install

# 3. Set up environment (for the contact form)
cp .env.example .env
# Edit .env and add your Web3Forms access key
# Get a free key at https://web3forms.com

# 4. Dev
npm run dev

# 5. Build
npm run build
```

## Contact Form Setup

The contact form uses [Web3Forms](https://web3forms.com) — a free, serverless form backend.

1. Go to [web3forms.com](https://web3forms.com) and enter your email to get an **access key**
2. Copy `.env.example` to `.env`
3. Replace `your_access_key_here` with your actual key:
   ```
   VITE_WEB3FORMS_KEY=your-actual-key-here
   ```
4. The key is read at build time via `import.meta.env.VITE_WEB3FORMS_KEY`

> **Note**: `.env` is gitignored. The key is safe locally but will be embedded in the built JS bundle (this is expected — Web3Forms keys are public-facing, similar to reCAPTCHA site keys).

## Vercel Configuration

The primary deployment is on [Vercel](https://mhtamim136.vercel.app) (GitHub Pages stays as a fallback). The Vercel Functions (`/api/projects` and `/api/contact`) need these environment variables, set in the Vercel dashboard → **Settings → Environment Variables** (Production scope):

| Variable | Purpose | Where to set |
| -------- | ------- | ------------ |
| `GITHUB_TOKEN` | GitHub API token for `/api/projects` (fresh repo data) and the build-time project snapshot | Vercel dashboard (Production) |
| `RESEND_API_KEY` | Resend API key for `/api/contact` (sends the contact-form email) | Vercel dashboard (Production) |
| `VITE_WEB3FORMS_KEY` | Web3Forms key — contact-form fallback (also needed at build time) | Vercel dashboard (Production) |
| `CONTACT_TO_EMAIL` | (Optional) Where contact-form emails go — defaults to `mhtamim136@gmail.com` when unset | Vercel dashboard (Production) |

> **Note**: changing an environment variable only applies to new deployments — redeploy after adding or changing one. The contact API sends from Resend's `onboarding@resend.dev` address, which only delivers to the Resend signup email; a verified sending domain is optional, not required, for this single-recipient form.

## Profile Image

Drop any image into the `/Image/` folder. The site auto-discovers it via Vite's `import.meta.glob`. No filename changes needed.

- Recommended: head-and-shoulders portrait, square or portrait aspect ratio
- The avatar crops to a circle with `object-position: center 20%` to keep the head visible

## Project Card Images

Each project card can show an automatic image slideshow. In a project repo, add a folder named exactly `Project_Card` (capital P and C, underscore) at the repo root with 1 or more images (png / jpg / jpeg / webp / avif / gif). The card then shows them 16:9 at the top — auto-advancing every 3.5s, with arrows, dots, a counter, and swipe. A repo without the folder keeps the current text-only card.

- The folder is discovered at build time by `npm run fetch-projects` (runs automatically before every build via `prebuild`), which writes the image URLs into `public/projects.json` — the live site makes zero extra GitHub API calls for images.
- A folder named `Project Card` (with a space) is accepted as a legacy fallback; `Project_Card` wins if both exist.
- To test: add the folder to a repo, run `npm run fetch-projects`, then `npm run build` and `npm run preview`.

## Project Structure

```
├── Image/               # Profile photo (auto-discovered)
├── public/              # Static assets (favicon, resume)
├── src/
│   ├── components/      # Reusable UI components
│   ├── data/            # Portfolio content (portfolio.js)
│   ├── hooks/           # Custom React hooks
│   ├── sections/        # Page sections (Hero, About, etc.)
│   └── utils/           # Utilities
├── .env                 # Environment variables (gitignored)
├── .env.example         # Template for .env
└── index.html           # Entry point
```

## Tech Stack

| Layer      | Tech                                    |
| ---------- | --------------------------------------- |
| Framework  | React 18                                |
| Bundler    | Vite 6                                  |
| Styling    | Tailwind CSS 3.4                        |
| Animation  | Framer Motion 11                        |
| Icons      | Lucide React + React Icons              |
| Font       | Plus Jakarta Sans (headings) + Inter    |
| Forms      | Web3Forms                               |
| Deploy     | GitHub Pages                            |

## License

MIT
