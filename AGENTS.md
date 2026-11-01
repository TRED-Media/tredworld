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
- For asset/render changes, use [.agents/skills/tred-asset-quality/SKILL.md](.agents/skills/tred-asset-quality/SKILL.md), which integrates the pinned pixel-art and sprite-pipeline skills. Read ASSET_QUALITY.md and ART_PIPELINE.md.
- `npm run assets:check` is required by build. Audit preserved sources with `npm run assets:audit`; known legacy failures are reported, not mislabeled as clean. New art uses the strict manifest profile.
- Normalize whole animation strips into NEW ignored work/ candidates; use one seed, palette, scale and origin. Never overwrite original masters or silently recenter each pose.
- Visual release checks also include `npm run test:pipeline`, `npm run test:assets` and `npm run test:graphics`; inspect before/after evidence before publishing.
