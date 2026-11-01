# Workstation and wearable restoration

Baseline: `5c7cf9d`, with immutable source and visual checkpoint under `work/quality-restoration/workstation-wearable-v1/checkpoint/`.

## Root causes and fixes

- Workstation placements used icon bounding boxes, ignoring the trimmed desk's actual top. PC cases and keyboard/mouse sets could hang in front of its legs. The shared layout now computes a tabletop plane from the uniformly fitted native desk, fits each object's proportions, and attaches its contact point to that plane. Cooling equipment follows its PC. Changing a desk moves its supported equipment together. Editor bounds, drag inverse and world composition use the same result. Existing layout values and ownership stay unchanged in storage.
- Chairs used the front-facing shop sprite in a workstation facing up. A new five-frame rear-view strip matches the five original styles. The shop retains the original fronts. Working characters render behind the rear chair shell with the head above it; interaction/collision coordinates are unchanged.
- Clothing was pasted between fixed horizontal cuts, with a generic neck rectangle and wrist-only skin strips. This removed forearms and could leave original gray shoulder wedges behind a collar. The renderer measures each base/view's neck, preserves complete original skin, fits a whole garment from collar to hem, and overlays the original chin/neck/hair with direction-aware clipping. Shoes retain existing ankle/cuff behavior.
- Single-object decorations now discard detached atlas neighbours; the rug no longer includes a tablet-row stroke. Keyboard/mouse and speaker sets remain intact.

The generated chair source, reference hash, brief and exact export configuration are preserved in `art-source/`. The candidate-only exporter uses a single scale/origin and a locked 36-color palette. Its runtime output contains 33 colors, alpha 0/255 and no orphan pixels; reproducing it yielded identical PNG bytes. All 16 original masters are unchanged. New custom desks declare `art.surface`, garments can declare `art.collar`, and custom chairs declare an `art.rear` atlas view.

## Actual verification

- 54 Node tests and 4 Python pipeline tests passed.
- Production build and 17-master source gate passed, including the new strict export.
- 80 outfit/model/view/motion combinations passed neckline, forearm coverage, accessory proportions, feet and trouser-cuff checks.
- 25 native-art workstation combinations passed contact-plane checks; layout tests cover saved position extremes, desk changes, non-mutation of player data and drag round-trips.
- 301 catalog items and 1,568 rider/model/view/phase renders passed; car exteriors remain intact and drivers visible behind glass. Warm-frame canvas allocation checks passed.
- Browser gameplay passed two sessions, touch release, purchase/equip/reload persistence, wallet/XP, shared workstation updates and walking to an own chair for photo check-in. No runtime JavaScript errors.
- Graphics passed desktop/retina/mobile/wide-mobile/landscape, including DPR 3 chair tapping and density/zoom checks.
- 20 deterministic before/after scenarios captured. The 16 intentional visual changes were opened in before/after/diff sheets and reviewed against hashes; four UI views were unchanged. This is an accepted visual change, not a zero-diff result. Comparison and review: `work/quality-restoration/workstation-wearable-v1/verification-final/comparison/`.

An intermediate image exposed a female back-view neck gap after removing the original shoulders. That check failed, the direction-specific clip was corrected, and the final full suite passed. Earlier logs/candidates remain available; the original baseline was not replaced.

No backend, player database, balance, inventory IDs, gameplay movement/collision or dependency changes. Existing legacy alpha/palette debt remains reported. Headless mobile emulation is not physical-device verification.

## Changed files

- Rendering/layout: `src/actor-anatomy.js`, `src/wearable-fit.js`, `src/character-art.js`, `src/workstation-layout.js`, `src/art-assets.js`, `src/item-art.js`, `src/economy-ui.js`, `src/main.ts`.
- Art/provenance: `public/art/chairs-rear.png`, `public/art/quality-manifest.json`, `art-source/chairs-rear.generated.png`, `art-source/chairs-rear.source.json`, `scripts/prepare-chair-rear.mjs`.
- Regression coverage: `tests/workstation-fit.test.js`, `tests/appearance-browser.mjs`, `tests/visual-capture.mjs`.
- Handoff/docs: `ART_PIPELINE.md`, `ASSET_QUALITY.md`, `progress.md`, this report.
