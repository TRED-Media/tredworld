# T-RED reference-based game artwork

Current cardinal artwork (generated for the four-direction update):

- `characters-cardinal.png`: 4 columns (front, back, left, right), 2 rows (male, female). These are visual models; player accounts and ownership are preserved.
- `wearables-cardinal.png`: 4 directions in columns, rows cap / hoodie / shoes / glasses. Shop thumbnails and worn layers use the same frames and catalog palette.
- `furniture-straight.png`: 5 columns of designs, desk row then monitor row. All face straight forward.
- `office-empty-stations.png`: existing environment with editable workstations removed. Real desks, monitors and owner nameplates render independently.

Previous PNGs below are retained as source/archive; the character renderer no longer uses the twelve-person roster or diagonal clothing sprites.

Generated from the owner's supplied T-RED WORLD design boards. These are recreated assets, not extracted source artwork or a pixel-identical reproduction.

- office-character.png: 4 columns x 4 directions, idle and walk frames.
- pet-atlas.png: 20 pets in catalog variant order.
- vehicle-atlas.png: 12 vehicle models in catalog variant order.
- items-atlas.png: 5 designs across 11 rows: shirts, glasses, hats, shoes, cases, monitors, cooling, desks, chairs, decor, accessories. Row boundaries are calibrated in src/item-art.js. Existing rarity trims preserve distinct catalog variants.
- office-atlas.png: reception, waiting chairs, plant, dispenser; equipment shelves, meeting table, studio camera/light, backdrop; coffee counter, vending, copier, sofa. Calibrated cell boundaries in drawOfficeProp.
- ui-atlas.png: office, quests, store, inventory; ID, workspace, vehicle, pets; coin, trophy, settings, gift.

Artwork only changes presentation. Purchases, equipment, wallet, permissions and layout remain authoritative game state.

- staff-roster.png: 12 identities, four views. Column selected by stable account ID; view follows local movement. Walking uses a small runtime bob because this atlas contains direction views rather than stride frames.
- office-scene.png: clean office environment with generated HUD and baked characters removed. The scene is cropped at render time. Editable central desks render independently. Collision rectangles and room zones are maintained in src/world.js; new accounts start in the connecting corridor.
