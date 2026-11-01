---
name: tred-visual-testing
description: Prevent T-RED image and gameplay regressions using immutable checkpoints, deterministic captures, pixel diffs and reviewed evidence.
---

# tred-visual-testing

Read DEVELOPMENT_SKILLS.md. Before changes, create a source checkpoint and `npm run visual:capture -- --output work/.../before`; after changes capture to a NEW .../after directory. Capture uses temporary SQLite, fixed Date/locale/timezone and paused test-only browser frames. Runtime/persistence clocks are not modified.

Run `npm run visual:compare -- --before <dir> --after <dir> --output <new report dir>`. Missing/corrupt/resized screenshots, renderer/browser mismatch and exceeded bundle budgets are blocking failures. Pixel changes generate before/after/diff evidence; zero-diff actor/vehicle galleries catch small details that a whole-page percentage would hide. UI alone allows at most 16 pixels with a one-channel-level (1/255) delta to handle measured border-raster noise; raw deltas remain reported. Asset galleries stay exact. There is no auto-baseline update.

Actually open world, UI, male/female equipment and four-direction rider pictures. Expected visual changes require a specific reason and review of ALL changed images; use the review command to bind the decision to exact hashes. Codex can record its own visual inspection; this is not an invented user approval requirement. Review cannot waive missing evidence, dimension/environment failures or gameplay failures, and becomes stale when artifacts change.

Run selected unit/assets/gameplay/graphics checks too: images do not prove collision, ownership, live networking or camera hardware. Keep logs and limitations. Do not label legacy alpha/palette exceptions strict passes. Never reuse user production DBs or deploy to establish a visual baseline.
