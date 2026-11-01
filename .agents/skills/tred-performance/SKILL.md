---
name: tred-performance
description: Measure T-RED Canvas, asset-cache and DOM performance before making bounded optimizations.
---

# tred-performance

Establish a baseline: emitted JS/CSS gzip size, source/image bytes, canvas backing dimensions, warm-frame allocations and relevant browser traces. Use npm run build and the allocation checks in test:assets; visual manifests record bundle metrics. Current regression budgets are in config/development-skills.json; a threshold change must be explained, not silently raised.

Inspect repeated DOM writes/layout reads in RAF, redundant canvas resizing, unbounded caches, image decode, full-scene work and context save/restore. Keep existing FrameCache bounds and source transparency/quality. Optimize the measured bottleneck with one scoped change, retaining pixel sampling, anchors, collision and gameplay timings.

Do not lower source resolution, alter sprite proportions, drop layers, turn off antialiasing for UI text or reduce fidelity merely to increase a synthetic FPS number. Do not split bundles just to hide a warning. Browser emulation/CI timings do not establish physical-phone FPS, battery or a 60-player capacity. Profile headless results as diagnostic, report actual hardware/browser when available, and compare visuals/behavior after optimization.
