---
name: tred-animation
description: Fix and verify T-RED four-direction character, equipment and vehicle animation in the shared Canvas rig.
---

# tred-animation

Inspect src/character-art.js, vehicle-rig.js, asset-rules.js, actor-anatomy.js, rider.js, vehicle-preview.js and presence-motion.js. This is Canvas composition, not a Spine runtime. Use the common solver and native source axes; no one fixed seat/scale for every model.

Keep Front/down, Back/up, Left, Right in body and vehicle. Mounted body, head, hands, feet, vehicle and label consume one actor root/facing. Hands contact each model's grips, hips contact its saddle, one shoe per foot contacts pedals/supports; stopped bicycles stop pedaling. Torso projection may foreshorten the shirt; do not stretch the head or leave standing pants/legs. Cars keep opaque roofs/bodywork and only show the approved portrait through the rotating windshield mask.

Walking and riding derive from server-owned equipment and vehicleParked. Enter/exit/reconnect must choose the correct pose without changing wallet, ownership or speed/collision as collateral work. Remote interpolation must not split the vehicle and rider or rotate them on different packets.

Preview every vehicle, both bases, four directions and multiple moving phases plus stop/park/walk. Inspect silhouette, knees/elbows, clothing, cuffs and occlusion at world and fitting size. Run assets:check, test:assets, Node tests and deterministic visual comparison. New drawn animation strips follow sprite-pipeline's shared scale/origin and seed lock. Adding Phaser/Spine requires a design checkpoint; it is not an automatic fix for these poses.
