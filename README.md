# Yield Board Calculator

**Free woodworking cut-list optimizer from Althoff Woodshop**

A modern web app that helps woodworkers turn a list of available lumber into efficient cut plans with minimal waste. Includes:

- **Board Yield Planner** — assign parts to boards, visualize cuts, get step-by-step instructions
- **Resaw Planner** — optimized milling sequence for kumiko-style thin strips
- **Box Planner** — open-top storage bins with dado bottoms

Live at: https://yield.redgamut.com

![Board Yield Calculator Screenshot](https://yield.redgamut.com/logo.png)

## Quick Start (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/whittles/yield.git
cd yield

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open http://localhost:5173 (or the port shown in terminal).

## How Deploy Works

This is a static Vue 3 + Vite + Tailwind app. `npm run build` produces a `dist/` folder containing only static HTML, CSS, and JS.

The production site is hosted on GitHub Pages (or any static host) at `yield.redgamut.com`. The `public/CNAME` file tells GitHub Pages to serve it at that custom domain. The `gh-pages` branch (or GitHub Pages source setting) contains the built assets.

Every time you push to the main branch, a GitHub Action (or manual `npm run build` + deploy) updates the live site.

## License

MIT © Althoff Woodshop

See [LICENSE](LICENSE) for full text.
