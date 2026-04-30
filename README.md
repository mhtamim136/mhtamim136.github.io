# Murad Hasan Tamim — Portfolio

Dark, grid-backed developer portfolio built with **React**, **Vite**, and **Tailwind CSS**, plus light **Framer Motion** for motion. Content lives in `src/data/portfolio.js`.

## Prerequisites

- Node.js 18+ (20 LTS recommended)

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

`preview` serves the production build locally for a quick check.

## Resume file

Add your PDF at `public/Resume/Resume-MHTamim.pdf` (or change `resumeLink` in `src/data/portfolio.js`).

## Deploy

### Vercel

1. Push the project to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com), import the repo.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

### Netlify

1. Push the repo.
2. In [Netlify](https://netlify.com) → Add new site → Import from Git.
3. Build command: `npm run build`.
4. Publish directory: `dist`.
5. Deploy.

For a manual Netlify drop, run `npm run build` and upload the `dist` folder.

## Project layout

- `src/components/` — reusable UI (`Button`, `Card`, `Container`, `Tag`, `SectionWrapper`, navbar, scroll control).
- `src/sections/` — page sections (lazy-loaded in `App.jsx`).
- `src/data/portfolio.js` — all copy, links, and lists.
- `src/hooks/` — `useActiveSection`, `useScrollTop`.
- `src/utils/links.js` — safe external link defaults.

## Security notes

- External anchors use `target="_blank"` and `rel="noopener noreferrer"` via `externalLinkProps`.
- No API keys or secrets belong in this repo; keep only public URLs and email.
