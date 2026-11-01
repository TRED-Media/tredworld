---
name: sprite-pipeline
description: T-RED Canvas adaptation of kevinoldching's sprite-pipeline. Use for whole-strip animation, shared anchors and scale, approved seed continuity and mounted sprite previews.
---

Upstream: https://github.com/kevinoldching/codex-plugins/blob/33bd9529725fcee78c9e51fcbaa93cd963c3a47b/plugins/game-studio/skills/sprite-pipeline/SKILL.md

Read `ASSET_QUALITY.md` and `.agents/skills/tred-asset-quality/SKILL.md` for the project's source-preservation rules. The original upstream workflow was read and pinned in `../upstream-lock.json`; this is a project-specific implementation, not a claim that the upstream scripts were installed globally.

1. Select a shipped or reference seed with the intended identity, proportions, palette and pose. Preserve its original PNG and record its hash. Review a strict derivative seed when a legacy source contains partial alpha or excess colors.
2. Lock the seed palette and frame specification before generation. Use the available image generation tool when new artwork is actually necessary.
3. Generate one complete action strip per direction in a single edit. Preserve the seed, costume, palette family, transparent background, exact slot count and facing. No labels, scenery or unrelated characters. Treat the entire strip as one asset when applying pixel-art's sequential-generation rule.
4. Normalize with `scripts/sprite_pipeline.py normalize --help`. Supply `--input`, `--seed`, `--palette`, `--frames`, `--width`, `--height`, `--direction` and a NEW `--output work/...` directory. Use `--lock-frame1` when the action must begin at the exact seed.
5. The project adapter uses ONE scale and ONE slot-space origin for the entire strip. It preserves asymmetric limb motion instead of recentering independently trimmed frames. It repairs candidate alpha/palette pixels, rejects clipping, validates the seed, audits every output and records metadata. It cannot overwrite masters, saved data or existing candidates.
6. Use T-RED order front/down, back/up, left, right. Map any donor layout explicitly; do not import the other skill's example row order unchanged.
7. Inspect native-size, animated and in-engine previews before changing an atlas/index. Rider assets additionally need saddle/grip/foot/cabin metadata, all four views, both base models and movement/stop/park checks. Reuse the common vehicle solver; do not paste a standing body over a vehicle.

Run `npm run test:pipeline`, `npm run assets:check`, `npm run test:assets` and `npm run test:graphics`. The source checker is also a production build gate. Keep approved candidate provenance and before/after evidence; do not remove owned catalog IDs.
