---
name: tred-asset-quality
description: Audit, restore and normalize T-RED WORLD assets without changing gameplay or losing original artwork. Orchestrates the pinned pixel-art and sprite-pipeline skills for Canvas 2D.
---

Use this skill for character, clothing, item, vehicle, environment or animation asset work in this repository.

1. Read `AGENTS.md`, `ASSET_QUALITY.md` and `ART_PIPELINE.md`. Save the current Git SHA, working diff and before screenshots under ignored `work/quality-restoration/`. Never reset another turn's edits or rewrite a master with a resized preview.
2. Apply [pixel-art](../pixel-art/SKILL.md) for palette, binary alpha, isolated noise, grid/atlas and export audits; apply [sprite-pipeline](../sprite-pipeline/SKILL.md) for seed continuity, whole-strip generation and shared scale/anchor normalization. Read referenced upstream scripts before execution and run `--help` first.
3. Prefer the best preserved source in Git. Runtime selects the original five garment designs, complete native atlas crops and two cardinal bases. Do not recolor one garment to impersonate every design. Do not turn a sheet into equal cells when its native regions cross those boundaries.
4. The user's requirement to preserve original artwork takes priority over retroactively forcing the upstream pixel-art palette/alpha rules onto legacy masters. Report these as `legacy-issues`, never strict passes. Legacy exceptions bind to exact historical hashes; a replacement must pass the strict profile.
5. `npm run assets:audit` audits masters without writing images. `npm run assets:normalize -- --help` describes candidate-only repairs. Locked palette, transparency, consistent density, one strip scale/origin, exact seed lockback and no clipping are required for new exports. Orphan failures require review; do not erase meaningful details blindly.
6. `npm run assets:check` checks source integrity, declared native layouts, directional garment regions, vehicle axes, mounts and riding phases. New PNGs require a manifest entry with `quality: strict`, a locked palette, exact frame grid and one anchor. Build runs these gates automatically.
7. Use `render-quality.js` for display density and CSS/world projection. Text/UI remain vector/CSS or screen-space labels. Keep nearest sampling for game art and bounded high-resolution composition caches. No player position, collision or economy changes belong in visual repairs.
8. Validate four directions, both bases, all active vehicles, moving and stationary poses, character shoes/cuffs, windshield occlusion, remote motion and mounting/parking. Run unit, pipeline, asset, gameplay browser and graphics checks. Inspect the resulting screenshots; create the standalone comparison with `npm run report:graphics`.
9. State actual results and remaining quality debt. Headless browser emulation is not physical-device verification. Never claim that legacy PNGs meet strict pixel standards merely because the renderer/build passes.
