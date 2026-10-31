# Validation
Passed: npm run build (TypeScript and Vite); npm test (3 tests: eight employees/unique rooms; every room wall/door; desk collision and continuous corridor to parking).
Dev server returned HTTP 200 for the app shell.

Browser verification blocked: Playwright Chromium download returned HTTP 403 Domain forbidden for cdn.playwright.dev. System Chromium was also detected; the Playwright attempt did not complete and its results are unconfirmed. No mobile viewport, joystick, camera or two-tab browser checks are claimed as passed. Run `node tests/browser.mjs` with system Chromium available. Required manual acceptance: 360×800, 390×844, 430×932, 844×390 and desktop; WASD and release stop; drag joystick/cancel; collision and doors; desk inspect and close; no horizontal overflow; two tabs exchange position; quest marks persist. This file does not claim those checks passed.
