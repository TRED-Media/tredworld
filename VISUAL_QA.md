# Visual release review

## Graphics restoration and skill integration (2026-11-01)
- Preserved all sixteen original PNG masters byte-for-byte and recorded dimensions, SHA-256 and source history. Restored all five authored garment styles in runtime rather than recoloring one generic sheet. Retained the two cardinal bases and complete vehicle/pet crops.
- Fixed display-density canvas sizing, physical-pixel camera/zoom alignment and CSS-space touch mapping. Added screen-space owner/name text, direct high-resolution thumbnails/portraits and bounded native-detail composition caches. Updated UI typography, vector pixel icons, readable mobile catalog tiles and high-density fitting/workstation/map/vehicle previews.
- Projected rider torsos toward each model's actual grips; removed standing trousers, kept head proportions, sampled authored sleeves, exposed short-sleeved forearms and attached one shoe to each foot. Vehicle/driver root, cabin masking and authoritative ride/park behavior remain shared.
- Read/pinned both requested upstream skills and integrated them through AGENTS.md, local skills and build/audit/normalization scripts. New exports require strict alpha, locked palette, shared scale/origin, exact grid and anchor. Normalization tests verify exact seed lockback, asymmetric-limb position, candidate-only repairs and refusal to overwrite/clamp missing poses.
- Source audit reports **0/16 legacy masters passing strict pixel-art rules**. These are preserved reference exceptions tied to their original hashes, not false strict passes. Replacement images must pass the strict gate. See ASSET_QUALITY.md for the actual scope and remaining source debt.
- Inspected before/after actor and rider galleries plus desktop/mobile screenshots. Graphics checks cover five viewport/DPR configurations; asset checks cover 80 outfit cases, 301 items and 1,568 rider combinations. Gameplay, persistence, photo check-in, setup ownership and two-session movement checks passed. This is headless Chromium verification, not physical-phone testing.

Reference: owner's item collection and palette boards (cream paper, slate navy, dusty coral, sage, denim, warm wood).

## Changes verified before publishing
- Regenerated 55 base item sprites, mapped to the existing 220 clothing/office catalog entries. Pet and vehicle catalogs retain their artwork.
- One uniform scale factor preserves the source silhouette in item thumbnails, detail previews, characters, pets, vehicles, and office props. Transparent margins are measured separately from the visible sprite.
- Office scene uses a crop with the destination aspect ratio; collision coordinates use the same scale.
- UI icons use calibrated SVG view boxes with `meet`, avoiding background-image stretching and adjacent-cell fragments.
- Workspace preview fits the supported layout range; canvas CSS keeps its intrinsic ratio.
- Corrected dark tab text against the new cream catalog, clipped desk legs, and neighboring icon fragments found during screenshot review.

## Evidence
`npm test`, `npm run build`, `npm run test:browser`.
Browser suite checks movement, transactions, persistence, equipment, workspace, five responsive viewports and 288 distinct catalog renders. A mathematical fit test covers wide, tall and square source art. Runtime audit compares source and destination ratios.

36 screenshots cover all 13 item categories plus inventory, profile, quests, workspace and map at phone and desktop sizes. World screenshots are also inspected. Captures are reproducible under ignored `work/screenshots/` using the browser suite.

This is generated reference-based artwork; visual identity is close to the supplied boards, not a pixel-identical extraction. Existing rarity variants share base designs and are distinguished by rarity markers.

## Workstation and catalog follow-up
- Removed the rectangular replacement floor and extra desk sprites that covered the environment. Work points now follow the desks in the scene.
- E near the player's workstation toggles a back-facing seated pose, typing hands, and screen activity; moving stands up. The sit presence state is shared with other sessions.
- Facing follows actual movement after collision, not the intended input vector when a wall blocks an axis. Pointer coordinates are mapped through the canvas backing size.
- A grid reachability check verifies access from the shared corridor to all eight workstation seats.
- Catalog version 5 archives duplicate sale entries, retaining their IDs, inventory and transaction history. Each of 13 categories offers five items in five rarity levels (65 sale entries). Existing price/visibility administration remains effective after the one-time upgrade.
- Regenerated icon sheet and coral/slate/beige button treatments from the supplied UI sample.
- Final validation: 25 unit/integration tests, browser gameplay checks and the 36-screen capture suite.

## Photo check-in, restored collections and vehicle flow
- Restored all 20 reference pets and one sale entry for each of the 12 reference vehicle models. Previous purchases and legacy IDs stay available in inventory; other item categories retain five sale entries.
- Recalibrated eight chair centers from the scene and use clipped seated poses instead of offset replacement chair blocks. Added a matching second editing chair for the two assigned editing staff.
- Clicking the player's chair nearby opens camera/file photo check-in. Camera access starts only after the user opens it; streams stop on capture or modal close. Successful server check-in stores the compressed image, seats the character and grants check-in XP at most once per shift/day rules.
- Riding requires an owned, equipped vehicle. Parking is offered in the parking area, and the server rejects work check-in while riding. Purchased clothing uses the owned artwork; equipped pets accompany walking characters.
- Wide viewports use a uniform camera zoom minimum rather than stretching the scene or leaving the world uncovered on the right. Verified a 2560x1440 capture.
- Browser verification includes actual keyboard movement to the assigned chair, clicking it, image submission and entering Working state, in addition to ownership, wardrobe, restored collections, proportional rendering and responsive screens. Physical device cameras are not claimed tested.

## Live setup and wardrobe follow-up
- Replaced the environment with a version containing no baked personal desks or premium workstation equipment. Shared office and setup preview use one equipment-driven workstation renderer. Only owned, equipped items appear.
- Starter accounts receive a basic desk, chair, case and monitor, with no cooling or decor. Existing purchases are preserved. The director receives a one-time audited setup budget; admin/admin is a dedicated Founder test account with server-enforced zero-cost purchases.
- Setup has PC & Setup (case/monitor/cooling/accessories), furniture (desk/chair/desk accessories), and decoration (plants/pictures/shelves/lights & rugs). Purchase applies workstation upgrades and emits the existing live update to other players.
- Clothing uses a cached character-pixel material pass and fitted headwear/eyewear rather than inventory icons pasted on the body; portrait and world share the same composition.
- All workstation chairs face the monitors. The chair back is rendered after the seated character, hiding the body and lower head.
- Browser test logs in as admin/admin, purchases cooling through the new setup UI, checks the unchanged wallet and confirms another account sees the equipped item. Physical device testing is not claimed.

## Wearables, pets and mounted rendering review
- Regenerated fitted glasses, hats, tops and shoes matching the five inventory styles, with four directional views each. Removed the rectangular cap, wireframe glasses and clothing recolor approximation. Preview and world use the same wearable composition.
- Replaced equal-grid slicing and largest-component deletion with calibrated complete silhouettes. In particular, the salamander tail starts before its former cell boundary and car roofs start above the former last-row boundary. All 20 pets and all 12 vehicles retain those pixels.
- Added in-shop fitting/ride preview with four view controls. Pet preview uses the live follow/step renderer. No ownership or money changes occur from previews.
- Pets have eased trailing movement, facing mirroring, idle breathing, body sway and articulated foot strips; back-layer companions are occluded by their owner instead of drawing over the owner's head. This is runtime animation of the reference sprites, not a newly drawn four-direction animal atlas.
- Cars render the driver only inside the windshield cabin. Bikes/scooters use a clipped seated torso and bent legs. Walking character rendering is skipped while mounted. Vehicle labels and world-edge margins avoid covering or clipping the vehicle.
- QA gallery tests cover 20 wearables and 12 mounted models in four views, all 20 complete pets and changing pet animation frames, alongside the existing responsive/ownership/check-in suite. Canvas-edge checks catch fitting preview clipping. 30 unit/integration tests passed.

## Cardinal rider rig release
- Reconciled the recovered Cloud work with live main at `9ebd515`, retaining photo check-in, admin test shopping, live workstation equipment, complete atlas crops and ownership rules. No database reset or schema migration.
- Replaced the two-wheel standing-body overlay with articulated riding poses: per-model saddle, grips and supports; bicycle cadence; upright scooter posture; sportbike lean. Both character models use the same validated pose solver and original clothing textures.
- Cars retain opaque bodywork; only head and shoulders can appear inside their calibrated windshield mask. Vehicle and occupant share cardinal orientation and one world root.
- Added remote cardinal interpolation, including missed corners and turning after stopping. Authoritative ride/park state survives refresh and restores walking after parking.
- Added a live gallery of all twelve models in four directions, selectable male/female riders and movement controls. Reviewed the generated gallery and mobile preview. Asset checks sample four motion phases across the catalog (1,568 mounted combinations), preserve exterior car pixels and exercise the actual ride, stop and park controls.
- Validation: build; 43 unit/integration tests; isolated gameplay browser suite; asset browser audit. Physical phone testing is not claimed. Preview captures are under ignored `work/screenshots/`.
