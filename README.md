# Murad Hasan Tamim — Portfolio

Modern, polished personal portfolio built with **React 18 + Vite + Tailwind CSS + Framer Motion**.

🌐 **Live**: [mhtamim136.github.io](https://mhtamim136.github.io)

---

## Features

- ⚡ Vite-powered fast dev / build
- 🎨 Dark & light mode with animated circular-reveal transition (View Transitions API)
- 📷 Auto-discovers profile image from `/Image/` folder (no hardcoded filenames)
- 🔄 Projects auto-synced from GitHub API (cached in sessionStorage)
- 📬 Contact form via [Web3Forms](https://web3forms.com) with floating labels, validation, and honeypot spam protection
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

## Profile Image

Drop any image into the `/Image/` folder. The site auto-discovers it via Vite's `import.meta.glob`. No filename changes needed.

- Recommended: head-and-shoulders portrait, square or portrait aspect ratio
- The avatar crops to a circle with `object-position: center 20%` to keep the head visible

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
