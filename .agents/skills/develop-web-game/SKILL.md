---
name: develop-web-game
description: Develop the existing T-RED Canvas web game in small verified iterations using its installed Playwright and API fixtures.
---

# develop-web-game

Adapted from OpenAI Develop Web Game at commit 30444aed500c00c85294d12074f6e3ee794f808a and the official Game Playtest workflow. See config/skill-sources.json. The curated main path was removed upstream; do not install a mirror presented as current official code.

Loop: choose one behavior → implement a small delta → act with keyboard/touch → pause/observe → inspect screenshots, console and authoritative state → fix → verify. Use tests/economy-browser.mjs and tests/appearance-browser.mjs with temporary SQLite; keep @playwright/test already installed. Do not add global browser tools or an extra test framework.

The shipped app has DOM UI and multiple preview canvases, authoritative API state, and an RAF/presence clock. Do not replace this with the donor's single-canvas sample, fullscreen hotkey, global virtual-time shim, or window.advanceTime in production just to satisfy its client. Visual-only test clocks belong in isolated browser capture. Read state through the existing API/game modules in fixtures; include coordinate origin (top-left, +x right, +y down), facing, walking/ride/sit state and visible equipment in evidence.

Exercise full sequences, not just individual clicks: move/release/collision, open/close overlays, buy/equip/reload and mount/move/stop/park/walk. Retest affected neighbor features and compare representative screenshots. Report actual failures and limitations. Append checkpoint/results to progress.md; do not overwrite another turn's original prompt or notes.
