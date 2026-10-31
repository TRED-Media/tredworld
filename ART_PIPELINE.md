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

Wearables inherit their catalog color. Keep the source garment's tintable fabric in the established red (hoodie), blue (cap) or midtone (shoes) material range; preserve outlines and white accents. The actual color and art definition participate in texture cache keys. Rarity decorations are excluded from worn textures and applied separately. Missing or loading worn layers retain the base garment, hair and footwear until their source is ready.

## Composition, animation and depth

The actor compiler fits the base once and uses that exact transform for preserved skin/hands. It composes torso, hands, head, cap and glasses into a bounded cached canvas. Shoes use the floor anchor, independently of torso bob. Seated and driving poses hide standing legs and shoes. Animation receives elapsed-time ticks (60 ticks/second), not the number of display refreshes.

`actor-anatomy.js` measures the head silhouette, face and feet in each model/view once. Hats inherit skull width and crown height; glasses inherit face width and eye line. Padding in a shop icon must not determine accessory size. Footwear inherits the original foot span and is clipped at the measured ankle line, then trousers render in front of the shoe collar. This prevents large boot sprites from repainting the shins in front/back views.

World objects are sorted by their ground depth, then layer. Desktop items share their desk's depth; chairs and people keep their own floor depth. Nameplates render as labels after physical objects. Preview and world workstations use `workstationParts()` and `drawStationPart()` together, so they cannot disagree about their artwork or layout.

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

The pose solver builds shoulders, elbows, hips and knees from the saddle and contact anchors. Bicycles move their pedals only while moving; scooters and motorcycles keep their feet at the declared supports. Arms reach each grip. Clothing and skin reuse the character's prepared textures, while standing legs are excluded. Far limbs, vehicle, near limbs, front fairing, hands and head have an explicit composition order. The per-model rider data covers all twelve existing designs without separate scene or preview offsets.

The local actor updates immediately. `PresenceMotion` interpolates each remote actor once, follows cardinal legs across missed corner packets and supplies the same root and facing to vehicle, rider and labels. Mount state comes from authoritative `vehicleParked`, including after reconnect. Parking restores the walking renderer.

The garage's **Xem tư thế lái** action (also `?preview=vehicles` after login) previews every model with front, back, left and right riders, both base models, movement and pause controls. It does not buy or equip items. Existing live check-in, workstation equipment and ownership data remain in place.

## Checks

```sh
npm test
npm run build
npm run test:browser
npm run test:assets
```

The asset browser audit uses an isolated temporary database. It checks every catalog asset (including archived ownership references), both models, all cardinal views, four riding phases, accessory proportions, unchanged trouser-cuff pixels, seated legs, palette invalidation, fractional atlas boundaries and warm-frame canvas allocation. Car renders are compared with the original vehicle: pixels outside the windshield must stay unchanged, while the driver's face remains visible behind glass. It also runs fitting-room and authoritative mount, movement and parking checks. Captures are written to ignored `work/screenshots/` for visual review; do not update gameplay databases or remove owned items to repair presentation.
