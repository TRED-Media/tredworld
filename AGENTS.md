# T-RED WORLD

Node.js 24+. Preserve the existing Canvas world and pixel navy/coral style.

## Development skill routing and checkpoints

- Start with [.agents/skills/tred-development/SKILL.md](.agents/skills/tred-development/SKILL.md) and DEVELOPMENT_SKILLS.md. Run `npm run skills:route -- --task "<task>" --files <paths>`; read one primary adapter and selected supports, rather than loading every upstream skill.
- User scope wins over project adapters, which win over upstream examples. Canvas/DOM is the current engine. Phaser, Spine, React and provider CLIs are not automatically installed or enabled. Large runtime/engine/protocol changes require a design report/checkpoint before implementation.
- Before runtime/UI/asset edits, create `dev:checkpoint create --visual` in a NEW work/ directory. After edits run `skills:verify` against that checkpoint. Baselines, candidates and comparisons are separate immutable outputs; never replace a baseline to hide a regression.
- Open before/after/diff images. Record intentional visual changes with `visual:review` and verify the bound report with `visual:check`. Codex records its own inspection; no new user approval step is implied. Missing images, incompatible render environments, stale reviews and failed gameplay cannot be waived.
- Recovery uses `dev:checkpoint restore` to create a detached worktree. Never reset, clean or overwrite the current workspace, player database, ignored credentials or another turn's changes.
- Run `skills:check` after modifying skill instructions, permissions or routes. Record an updated lock only after actual review. Build checks the lock. See docs/DEVELOPMENT_SKILLS_RESEARCH.md and config/skill-sources.json for researched/deferred skills and script permissions.

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
