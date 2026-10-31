# T-RED WORLD
Playable office MVP, Vietnamese, mobile-first. Original procedural pixel art; reference images are not used as a background.

## Run
Node 24: `npm ci`, copy `.env.example` to `.env.local` and fill in the Supabase publishable key, then `npm run dev`. Production: `npm run build`.

## Connected services
- GitHub: `TRED-Media/tredworld`, production branch `main`.
- Vercel: `tredworld`, current domain `https://tredworld.vercel.app`.
- Supabase: `TRedWorld` (`peqaklqbgjhpozdukpxu`). Shared browser client: `src/supabase.ts`.
- Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel for each environment. Local values belong in ignored `.env.local`.
- This connects the SDK and configuration. Authentication, database-backed game saves and internet multiplayer still need implementation; existing demo behavior remains local.

WASD/arrows to walk, E near a desk to inspect. On mobile drag inside the map to walk; release to stop. Tap a desk to inspect it. Parking is south of reception. The −/+ button switches zoom. The map button lists rooms.

Demo characters, XP, RC and inventory are sample data. Quest marks and demo check-in persist locally. Open two tabs on the same origin to see positions via BroadcastChannel. This is not internet multiplayer. RC purchases, rewards, auth and approvals are intentionally unavailable until a trusted backend exists.

## Checks
`npm test` and `npm run build`. See TESTING.md for verification limits.

Map button now shows room positions and the player marker. Settings offer local work status, zoom and return to reception. Two-finger pinch changes zoom. Manifest and service worker provide a basic offline shell after an online visit; installability depends on browser support and has not been verified.
