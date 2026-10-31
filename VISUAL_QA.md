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
