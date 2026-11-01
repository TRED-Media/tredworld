---
name: tred-development
description: Route T-RED WORLD development tasks to compatible, reviewed skills; manage checkpoints, visual evidence and isolated recovery.
---

# tred-development

Read AGENTS.md and DEVELOPMENT_SKILLS.md first. Run `npm run skills:route -- --task "<user task>" --files <changed paths>`; it returns a plan, never executes it. Read the primary skill and only the selected supporting skills. This repository is custom Canvas 2D + DOM/CSS with Vite, not Phaser/Spine/React.

The task's user constraints take precedence, then AGENTS.md and project adapters, then the pinned upstream references. One primary skill owns implementation; supporting skills provide checks. `tred-asset-quality` owns asset preservation, `tred-animation` owns mounted poses, `tred-gameplay` owns movement/collision, and `tred-game-ui` owns DOM layouts. Do not run two independent upgrade workflows or let an upstream skill scaffold a replacement engine.

Before source changes, create an immutable checkpoint with `npm run dev:checkpoint -- create --label <name>` and capture a visual baseline into a NEW work/ directory. Read the state/remaining issues in progress.md. Keep original assets, ownership IDs and player data. Test servers must use temporary databases.

Implement one scoped change, capture a separate candidate, compare and open the images/diffs. Zero diff does not prove good design; existing defects remain defects. Expected visual changes require a written image review bound to this exact report and candidate hashes; Codex records its own inspection without inventing a user-permission step. Never refresh the baseline just to make a failure pass.

Run the routed checks. Record commands, results, viewport/DPR, source and screenshot hashes, plus any unverified boundaries. Missing images, wrong environments, stale review or failed gameplay must block completion. For large engine/protocol/runtime changes, produce a design checkpoint/report before implementation, following the user's staged request. A routed skill is not authorization to deploy or contact other people.

Rollback uses `npm run dev:checkpoint -- restore --checkpoint <path>` to make a detached recovery worktree, leaving the current workspace, database, ignored files and credentials intact. Production rollout is a separate task scope; no push to main while building this skill system.
