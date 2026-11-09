# Murad Hasan Tamim — Portfolio

Modern, polished personal portfolio built with **React 18 + Vite + Tailwind CSS + Framer Motion**.

🌐 **Live**: [mhtamim136.vercel.app](https://mhtamim136.vercel.app) (primary) · [mhtamim136.github.io](https://mhtamim136.github.io) (fallback)

---

## Features

- ⚡ Vite-powered fast dev / build
- 🎨 Dark & light mode with animated circular-reveal transition (View Transitions API)
- 📷 Auto-discovers profile image from `/Image/` folder (no hardcoded filenames)
- 🔄 Projects served fresh from the `/api/projects` Vercel Function, with a build-time snapshot (`public/projects.json`, regenerated on build) as fallback
- 🖼️ Project cards show an automatic image slideshow from each repo's `Project_Card` folder (text-only fallback when a repo has none)
- 📬 Contact form via [Resend](https://resend.com) ([Web3Forms](https://web3forms.com) fallback) with floating labels, validation, and honeypot spam protection
- 🧩 Language filter chips for projects
- 🎯 Scroll spy navigation with icon-only pill navbar
- 📱 Fully responsive (mobile-first)
- ♿ Accessible — `prefers-reduced-motion`, focus-visible rings, ARIA labels, WCAG AA contrast
- 🖼️ Background grid, gradient blobs, scroll progress bar

## Quick Start

```bash
# 1. Clone
git clone https://github.com/mhtamim136/mhtamim136.github.io.git
cd mhtamim136.github.io

# 2. Install
npm install

# 3. Set up environment (for the contact form)
cp .env.example .env
# Edit .env and add your Web3Forms access key (contact-form fallback;
# also used in local dev, where the form uses Web3Forms directly)
# Get a free key at https://web3forms.com

# 4. Dev
npm run dev

# 5. Build
npm run build
```

## Contact Form Setup

The contact form sends mail through the `/api/contact` Vercel Function using [Resend](https://resend.com) (free tier: 100 emails/day). [Web3Forms](https://web3forms.com) stays as the fallback — it takes over on GitHub Pages (where no Function exists) and if the Resend call ever fails.

1. Get a Resend API key at [resend.com](https://resend.com) and set it as `RESEND_API_KEY` in the Vercel dashboard (see the Vercel Configuration section below)
2. Get a Web3Forms access key (free) for the fallback: go to [web3forms.com](https://web3forms.com) and enter your email
3. Copy `.env.example` to `.env` and replace `your_access_key_here` with your key:
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
| `CONTACT_FROM_EMAIL` | (Optional) Sender address for `/api/contact` — defaults to Resend's `onboarding@resend.dev` when unset | Vercel dashboard (Production) |

> **Note**: changing an environment variable only applies to new deployments — redeploy after adding or changing one. The contact API sends from Resend's `onboarding@resend.dev` address, which only delivers to the Resend signup email; a verified sending domain is optional, not required, for this single-recipient form. If `CONTACT_TO_EMAIL` is ever changed to an address other than the Resend signup email, set `CONTACT_FROM_EMAIL` to a verified-domain sender — the onboarding address cannot deliver to other recipients.

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
├── api/                 # Vercel Functions (projects.js, contact.js)
├── plugins/             # Vite plugins (hero image optimiser, font preload)
├── public/              # Static assets (favicon, resume, projects.json)
├── scripts/             # Build-time scripts (fetch-projects.mjs, featuredDetails.mjs, sync-ai-catalog.mjs)
├── src/
│   ├── components/      # Reusable UI components
│   ├── data/            # Portfolio content (portfolio.js)
│   ├── hooks/           # Custom React hooks
│   ├── sections/        # Page sections (Hero, About, etc.)
│   │   └── HeroCtaFill.css  # Hero CTA hover-fill (L-to-R wipe)
│   └── utils/           # Utilities
├── .env                 # Environment variables (gitignored)
├── .env.example         # Template for .env
├── .github/workflows/   # CI (PR build check) + Pages deploy
├── index.html           # Entry point
├── postcss.config.js    # PostCSS (Tailwind + Autoprefixer)
├── tailwind.config.js   # Tailwind theme
├── vercel.json          # Security headers + custom 404 page (no SPA rewrite)
└── vite.config.js       # Vite config
```

### Footer CTA rationale

The footer closes the page with one final invitation — it is not a
second contact section:

- "Let's build something together" appears nowhere else on the site;
  the hero has name/title/bio and Contact's title is "Contact".
- "Open to internships & collaboration" repeats the hero meta-label
  wording exactly — the one deliberate repeat (availability belongs
  at the close).
- "Get In Touch" is the same button as the hero primary (same label,
  same `#contact` target) — the Dennis Snellenberg pattern: the
  footer IS the CTA. No second form, email, or channel.
- Bottom bar shows a curated 3 only (GitHub, X, email); Facebook /
  Instagram / Discord are personal and stay in Contact only.
- Copyright is unchanged and dynamic (current year). No LinkedIn
  (no key in contacts). Entrance is one fade + 16px rise, gated
  with `useReducedMotion` so it is instant under reduced motion.

## Tech Stack

| Layer      | Tech                                    |
| ---------- | --------------------------------------- |
| Framework  | React 18                                |
| Bundler    | Vite 6                                  |
| Styling    | Tailwind CSS 3.4                        |
| Animation  | Framer Motion 11                        |
| Icons      | Lucide React + React Icons              |
| Font       | Plus Jakarta Sans (headings) + Inter    |
| Forms      | Resend (primary) + Web3Forms (fallback)      |
| Deploy     | Vercel (primary) + GitHub Pages (fallback)    |

## License

All Rights Reserved — see [LICENSE](./LICENSE) for details.
