# T-RED WORLD

Node.js 24+. Preserve the existing Canvas world and pixel navy/coral style.

- Setup: `npm ci`.
- Local game and API: `npm run dev` (5173 + 3001), local SQLite at ignored `data/game.sqlite`.
- Checks: `npm test`, `npm run build`, `npm run test:browser` (Chromium required).
- Economy rules live in `server/engine.js`; never trust client XP/RC, prices, approvals or roles.
- Production uses `api/game.js` and `server/cloud-store.js`, with Supabase compare-and-swap persistence.
- Production config is stored in Vercel, not in Git. Do not commit secrets, `.env.local`, databases or `.vercel`.
- GitHub main is connected to Vercel production. Check requested scope before pushing main.
- Read README and CLOUD_SETUP before changing persistence or deployment.
