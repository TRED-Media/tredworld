---
name: tred-gameplay
description: Preserve and verify T-RED movement, camera, collision, touch and interactions in its custom Canvas engine.
---

# tred-gameplay

Inspect src/main.ts, world.js, render-quality.js, presence-motion.js, api.js and relevant tests. World coordinates are 1344×1248, origin top-left, x right/y down. Collision uses explicit scene/furniture rectangles. Keep four-direction movement and actual collision-resolved facing.

Distinguish CSS pointer coordinates, world units and physical backing pixels. Use shared projections for taps/pinch/zoom; do not multiply touch coordinates by DPR twice. Keep a clear response to key release, blur, pointer cancel and modal input. Validate doors/corridors/chair reachability, parking boundaries, E/tap interactions, and two-player presence.

Do not tune collision to hide a bad sprite anchor, or change speed/authoritative ride rules while repairing artwork. Do not import Phaser Arcade Physics or a generic controller into the existing RAF loop. Large timestep/protocol/world-layout work needs an explicit design checkpoint and before/after movement evidence.

Use isolated API+DB browser fixtures; read authoritative position, facing, animation and ride state. Run Node reachability/projection tests, test:browser and test:graphics including DPR 3 touch. Compare world/UI screenshots; production persistence changes additionally need the appropriate connected service skill and authorization.
