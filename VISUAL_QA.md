# Visual release review

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
