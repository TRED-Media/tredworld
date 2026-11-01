# Asset pipeline for T-RED WORLD

The game remains a Canvas 2D renderer. Artwork and saved gameplay data have not been replaced. The rules below apply to new catalog items as well as existing inventory.

## Coordinates and frames

`src/asset-rules.js` is the source of truth for atlas grids, actor anatomy, wearable fitting boxes, workstation parts, vehicle size and cabin orientation. Coordinates are world pixels. Actors retain their existing gameplay root; `actorRig.floorOffset` converts that root to the floor. Clothing fits around that floor anchor and follows the same transform as the body.

Direction order is always **front/down, back/up, left, right**. Use four orthographic views. Put complete sprites inside equal grid cells with transparent backgrounds, without labels, ground shadows or neighbouring artwork crossing cell boundaries. Character bases must be neutral and have consistent anatomy and soles. Hats and glasses belong in the wearable atlas, not baked into the base.

`spriteFrame()` rounds shared cell boundaries before reading pixels. It trims transparent padding once and records empty frames. `drawFrame()` consumes that prepared frame directly, uses one scale for both axes, and disables smoothing. Do not stretch width and height independently or trim fitted layers again. A scene camera may scale the whole world uniformly.

Legacy atlases may declare normalized `rowCuts` when their rows are not equally spaced. The vehicle atlas does this explicitly. Set `isolate: true` only for a single connected object such as one vehicle or pet; preprocessing then drops detached fragments from neighbouring art. Do not enable it for intentionally disconnected objects such as paired shoes or speaker sets.

## Adding catalog artwork

Existing categories inherit their fitting box, layer order, animation and floor anchor automatically. The default sheets are declared in `atlasRules` and `wearableRules`. An item may select a new sheet without changing renderer code:

```js
art: {
  atlas: 'winter-hoodies', // public/art/winter-hoodies.png
  columns: 4,
  rows: 5,
  column: 0,
  row: 2,
  directional: true
}
```

A directional sheet must have four columns in the order above. A stationary prop uses `directional: false` and its declared column. Coordinates are validated; invalid grids are rejected. New categories or substantially different body anatomy require a deliberate rule in `asset-rules.js`, rather than offsets added to UI or scene code.

Default wearables use the original `wear-shirt`, `wear-hat`, `wear-glasses` and `wear-shoes` masters, with native rectangles in `wear-regions.js` (four directional rows, five styles). Their authored colors, logos, cuts and accents stay intact. The catalog's legacy palette values identify those original designs; an explicit custom palette still invokes the cached material tint. Do not replace all styles with a recolored generic hoodie. Custom `art` definitions remain supported. Actual color and art participate in texture cache keys. Rarity decorations are excluded from worn textures and applied separately. Loading worn layers retain the base garment, hair and footwear until their source is ready.

## Composition, animation and depth

The actor compiler fits the base once and uses that exact transform for preserved skin/hands. It composes torso, hands, head, cap and glasses into a bounded cached canvas at four samples per world pixel; final draw destinations retain the original world dimensions. Close-up views therefore read detail from the master instead of enlarging a 60-pixel intermediate. Shoes use the floor anchor, independently of torso bob. Seated and driving poses hide standing legs and shoes. Animation receives elapsed-time ticks (60 ticks/second), not the number of display refreshes.

`actor-anatomy.js` measures the head silhouette, face and feet in each model/view once. Hats inherit skull width and crown height; glasses inherit face width and eye line. Padding in a shop icon must not determine accessory size. Footwear inherits the original foot span and is clipped at the measured ankle line, then trousers render in front of the shoe collar. This prevents large boot sprites from repainting the shins in front/back views.

World objects are sorted by their ground depth, then layer. Desktop items share their desk's depth; chairs and people keep their own floor depth. Nameplates render as labels after physical objects. Preview and world workstations use `workstationParts()` and `drawStationPart()` together, so they cannot disagree about their artwork or layout.

Workstation geometry uses the **trimmed, uniformly fitted desk** and a normalized tabletop contact plane. The bottom of each PC, monitor stand, keyboard, lamp or plant meets this plane; moving/changing a desk moves these anchors together. Cooling equipment mounts inside the PC frame. Keyboard/mouse sets fit within the shallow tabletop, while headphones/speakers retain their own proportions. Saved 0–100 layout values are mapped onto physical placement rails without rewriting saved data. The editor uses those same rails for dragging, fields and selection bounds. Custom desks may supply `art.surface: {left, right, back, front}` as ordered UV bounds.

The shop keeps original chair fronts. Workstations use the five rear views in strict `chairs-rear.png`, facing into the desk. Custom chair art must declare a complete `art.rear` atlas spec. Rear-view generation is preserved separately; `scripts/prepare-chair-rear.mjs` exports a new candidate with one shared transform and locked palette, never resizes the shipped masters in place. Single-object decorations isolate their connected sprite so a neighbouring atlas row cannot leave a stray line beneath a rug; multi-object keyboard/mouse and speaker sets remain intact.

Garments use one collar-to-hem fit in `wearable-fit.js`, with the neck measured on each base/view. `art.collar: [u,v]` may specify a new garment's source collar point. Original neck, forearms and hands stay continuous underneath the garment; hair/chin and skin overlap the collar while the original gray shirt shoulders are excluded. Do not reintroduce wrist-only strips or generic skin rectangles. Jacket/hoodie hems may overlap the original waist, preserving their cut without stretching the source. Browser checks compare arm coverage to the unequipped base in addition to neckline, feet and cuffs.

Vehicles rotate around their actual fitted center. Cars and bikes declare their native forward axis separately. Car roofs and hoods remain opaque. The actor compiler supplies only a cropped head-and-shoulders portrait through the windshield; glass and window trim render over it. The windshield mask rotates with the car while the portrait stays upright in the selected cardinal view. No rectangular cutaway is drawn on the roof.

New car artwork must provide a normalized windshield polygon and an interior seat anchor in `vehicle.mount` or `vehicle.art.mount`. Existing cars inherit the calibrated legacy profile. Missing metadata on new car art, seats outside the polygon and crops including hips/legs are rejected by validation:

```js
mount: {
  window: [[0.28, 0.445], [0.72, 0.445], [0.78, 0.575], [0.22, 0.575]],
  seat: [0.39, 0.513],
  portrait: { top: -61, bottom: -25 }
}
```

These numbers describe the existing cars; calibrate the polygon against the actual windshield of a new design. Coordinates reference the uniformly fitted vehicle sprite, so camera scale and direction cannot move the driver onto the roof. Do not rotate an off-center shop card or use rarity badges as part of world geometry.

Prepared body, hand, tint and thumbnail caches have size limits. Warm animation should allocate no new canvases. All shop/detail/workstation thumbnails subscribe to art readiness, so placeholder art is replaced when the actual source loads.

## Vehicle riders

`src/vehicle-rig.js` resolves a shared type profile, model-specific overrides and optional `vehicle.rider` overrides. Two-wheel anchors (`seat`, two `grips`, two `feet`) are normalized to the fitted vehicle rectangle. Declare the native sprite axis as `forward: 'up'` or `'down'`; it controls both vehicle rotation and rider orientation. Optional `vehicle.rig` dimensions must be positive. Anchor and scale validation rejects malformed profiles before rendering.

The pose solver builds shoulders, elbows, hips and knees from the saddle and contact anchors. `reach` projects the chest toward the real grips and foreshortens its height in front views; the head retains its original proportions. The torso contains shirt pixels only, excluding standing trousers. Bicycles move their pedals only while moving; scooters and motorcycles keep their feet at the declared supports. Arms reach each grip and sample the authored sleeve color; short sleeves expose forearms. Each foot uses one shoe, rather than a whole pair. Far limbs, vehicle, near limbs, front fairing, hands and head have an explicit composition order. The per-model rider data covers all twelve existing designs without separate scene or preview offsets.

The local actor updates immediately. `PresenceMotion` interpolates each remote actor once, follows cardinal legs across missed corner packets and supplies the same root and facing to vehicle, rider and labels. Mount state comes from authoritative `vehicleParked`, including after reconnect. Parking restores the walking renderer.

The garage's **Xem tư thế lái** action (also `?preview=vehicles` after login) previews every model with front, back, left and right riders, both base models, movement and pause controls. It does not buy or equip items. Existing live check-in, workstation equipment and ownership data remain in place.

## World material and furniture contract — 2026-11-01

`config/world-art-contract.json` is the shared export/runtime contract. World art compiles directly from preserved native sources at **2 texels/world unit**; close-up actors compile at **4**, rather than resizing a previous compiled preview. Canvas backing density, camera projection and CSS text are separate. Legacy translucent source crops are converted once to binary alpha and a frozen 256-color palette; already strict custom palettes retain their authored RGB values. Prepared frame samples have bounded caches and preserve aspect ratio. Never resize an existing export repeatedly.

Character composition keeps the complete head silhouette, neck, skin, arms and trouser cuffs. Fabric replacement uses semantic regions instead of horizontal body strips; one garment transform and expanded native crop gutters retain its outline in all four views. Hats cover hair naturally without a scalp clipping rectangle. Compiled actor surfaces have transparent gutters and are audited at both densities. Existing vehicle contact-anchor/pose/window rules continue to use the same density-aware body compiler.

`office-standard.png` replaces the runtime background, preserving its floor plan while removing baked chairs and noisy floor overlays. `chairs-cardinal.png` contains five chair designs × four views with one export scale/anchor. Their raw generated sources, native layout, palette and SHA-256 provenance are retained in `art-source/`. The older background and chair masters remain untouched. Static furniture remains in its authored world orientation; pet artwork retains its original pose. Four-view checks apply to characters, wearables, riders/vehicles and the new chairs, not invented directional art for static objects.

Workstation chair placement derives from the actual desk floor/contact plane. `office-seats.js` declares 19 shared chairs plus nine workstation chairs, with stable IDs, approach, floor, facing, hit region and foreground occlusion. Any added chair must enter this registry; never bake an interactive chair into a raster. `office-interactions.js` supplies the same geometry to drawing, pointer hit testing and nearby hints. A gold square means usable; coral indicates focus and slate indicates occupied. UI instructions remain accessible DOM text.

New chair catalog artwork declares `art.directional: true` with four columns; `chairSource` selects its actual atlas for both the office entity and workstation preview. Existing custom front/rear art retains its authored desk-facing rear view. Missing directional art is rejected when that view is requested, rather than substituting a different chair design. Add custom atlases to the strict source manifest and use the shared registry/attachment rules.

Clicking a free chair follows a cardinal collision-safe path at the existing walking speed. Manual input cancels walking or stands up. Seat claims use authenticated server presence, atomic occupancy and a 45-second renewable lease, shared by local SQLite and the existing cloud CAS store. Leaving, driving or going Onsite clears the seat. Sitting awards no RC/XP and does not check in; the owner's existing E/photo workflow remains separate. No database schema migration is needed.

`npm run test:office` uses a new immutable output directory and temporary database. It audits actor alpha/gutters/head silhouettes at both densities, warm-frame allocations, real navigation/seating/standing across six chair locations, occupied rejection, reconnect, cancellation, mobile tapping and the existing photo workflow. `assets:check` also validates the frozen material contract, all 20 chair frames and collision-safe paths to all 28 seats. Preserve failed evidence and inspect new before/after/diffs before release.

## Checks

`render-quality.js` owns physical canvas sizing and CSS/world projection. The world follows screen density (capped at DPR 3 for memory); zoom and camera translation snap to complete physical pixels. Never use physical backing dimensions to map touch coordinates. Fitting, workstation, vehicle and map previews draw at their displayed density. Owner/actor labels draw after the world transform, using screen-sized system text. UI text and pixel SVG icons remain vector/CSS; no panel is enlarged with a CSS transform. Thumbnails read the master into a 256-pixel export directly; portraits and compiled actor layers have bounded caches.

Original PNGs are registered with dimensions, SHA-256 and Git provenance in `public/art/quality-manifest.json`. Run the source check in addition to visual tests. An intentional replacement requires a native-resolution comparison and explicit manifest update; never overwrite a source with a screenshot or resized export. Archived reference sheets stay available without becoming runtime fallbacks.

```sh
npm test
npm run build
npm run test:browser
npm run test:assets
npm run test:art-source
npm run test:graphics
```

The asset browser audit uses an isolated temporary database. It checks every catalog asset (including archived ownership references), both models, all cardinal views, four riding phases, accessory proportions, unchanged trouser-cuff pixels, seated legs, palette invalidation, fractional atlas boundaries and warm-frame canvas allocation. Car renders are compared with the original vehicle: pixels outside the windshield must stay unchanged, while the driver's face remains visible behind glass. It also runs fitting-room and authoritative mount, movement and parking checks. Captures are written to ignored `work/screenshots/` for visual review; do not update gameplay databases or remove owned items to repair presentation.
