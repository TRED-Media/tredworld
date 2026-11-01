# T-RED WORLD — staged world standardization

Baseline `ae5e206`, clean working tree. Source and 20 before images: `work/world-standardization/v1/checkpoint/`. This is a Canvas 2D/Vite game with DOM UI, four cardinal directions, local SSE/cloud polling and authoritative economy. No engine migration or player-data reset is proposed.

## Root causes

1. Source sprites contain partial alpha and nonuniform authored grids. Trimming changes origins; layers are then fitted/cropped independently, and the hat hides hair with a horizontal rectangle. High-resolution previews amplify these silhouette cuts. Source histories preserve the original masters; none have become higher quality through repeated edits.
2. Office rendering depends on one precomposed raster with soft source texture, while foreground sprites come from much denser atlases. Nearest filtering alone cannot recover missing source detail. A shared material/pixel-density rule and reviewed environment source are required, with UI typography kept separate.
3. Workstation chairs are positioned by a fixed scene-space Y range rather than a desk-relative seat relation. Background chairs are baked into the office image with no interaction metadata.
4. Input hit-testing only recognizes the owner's desk. Sit state implicitly means that desk, has no seat ID, and cannot represent a meeting/reception/lounge chair. There is no path to a clicked chair, uniform affordance or consistent occupied state.

## Phases and checkpoints

1. **Asset quality:** preserve original masters; normalize source alpha/grid/origins through a shared bounded material pipeline. Compile complete silhouettes with transparent gutters; replace destructive hair cuts and retain whole garment transforms. Audit both bases, every item and every vehicle in all four directions. New image candidates use original source references and locked palette/export rules; do not overwrite masters.
2. **Environment polish:** compare a crisp source candidate with the original; keep floor plan and palette. Normalize office materials, floors/walls and foreground sampling under the same density contract. Desk/chair geometry derives from one shared relation, keeping chairs near the work surface and interaction points aligned.
3. **Interaction system:** define a registry for every workstation and baked/static chair, including approach, sit position, facing, hit region, depth/occlusion and stable ID. Use cardinal pathfinding against existing collision, cancelling on manual movement. Seat/stand are separate from paid check-in and never award XP/RC. Represent seats through an additive authoritative seat action with expiring occupancy; generic JSON storage needs no migration. Retain photo work-check-in as a distinct action at the owner's chair. Use one hover/focus/nearby language and accessible DOM interaction hint for usable objects.
4. **Visual QA:** baseline and candidate outputs remain separate and immutable. Preview characters/items/vehicles in four directions, full office, all furniture pairs, several seated poses, free/occupied/highlight states. Test reachability of EVERY registered seat, entry/exit/cancel, simultaneous claims, reconnect/expiry, mobile taps and existing economy/photo workflows. Open before/after/diffs and record review hashes; failed gates block release.

Each phase gets its own source/evidence checkpoint. Rollback creates a detached recovery worktree from the baseline, preserving the current workspace and player data. Staging a new release follows actual visual review and the complete build/tests; no main reset, source replacement in place or database migration is involved.

## Boundaries

Keep 1344×1248 world coordinates, room topology, inventory IDs, wallet/XP rules, ownership, speed, parking rules, original designs and navy/slate/coral UI. Add only seating/pathfinding/interaction behavior authorized by the task. Geometry metadata describes the existing source; it is not per-image hand retouching. Measurements and headless tests do not establish physical-phone performance or production service health.
