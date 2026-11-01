---
name: tred-game-ui
description: Review and improve T-RED HUD, shop, wardrobe, menus and mobile responsiveness without rescaling the game or changing its design.
---

# tred-game-ui

Uses engine-neutral Game UI/UX principles adapted to DOM/CSS. Read config/skill-sources.json for the pinned upstream review; the Godot/Unity code examples are not applicable here. Support with web-design-guidelines.

Inspect src/style.css, economy.css, moodboard.css and quality.css together before changing specificity. Keep navy/slate/coral identity and pixel-art world. UI typography and icons stay CSS/vector at native screen density; never scale an entire panel to imitate bitmap pixels. Use flex/grid and safe-area insets, ensure readable Vietnamese and long names, scrollable tabs and useful touch targets. Game-space sprite anchors are not UI coordinates.

Test desktop, phone, landscape, zoom, focus-visible, keyboard close/back and reduced motion. Only the top dialog should consume game movement; check focus return/trapping before claiming keyboard accessibility. Camera/photo streams must stop when the dialog closes. Match shop art, fitting art and equipped art; do not buy/equip items merely to build a screenshot.

Prefer existing events for HUD changes. Do not rewrite screen-stack architecture or all CSS as incidental cleanup; record larger proposals at a design checkpoint. Capture baseline/candidate UI and world separately, inspect both, run test:graphics and test:visual plus gameplay checks when input/interaction is touched.
