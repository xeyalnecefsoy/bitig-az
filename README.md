# Bitig — Audiobook Storefront (UI Only)

A simple, modern, and user-friendly frontend for an audiobook sales platform built with Next.js (App Router), TypeScript, and Tailwind CSS.

Brand primary: #4AD860

## Features
- Clean, responsive UI with a green theme
- Pages: Home, Browse, Book Detail, Cart, Checkout (UI-only)
- Sample data (no backend)
- Simple cart state via React Context (client-only)

## Requirements
- Node.js 18.17+ or 20+

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 in your browser.

## Notes
- This is a UI-only demo. No real payments or server-side data.
- The file `next-env.d.ts` is generated automatically by Next.js when you run the dev server.
- IDE warnings about `@tailwind`/`@apply` disappear once PostCSS/Tailwind run in the dev server.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — create production build
- `npm start` — run production server
- `npm run lint` — lint
