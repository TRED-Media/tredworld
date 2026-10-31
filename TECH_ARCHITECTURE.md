# Kiến trúc hiện tại

- Vite/TypeScript, Canvas 2D giữ bản đồ và collision ban đầu.
- `src/economy-ui.js`: modal game và HUD economy; `src/item-art.js`: procedural pixel sprites và equipped rendering.
- `src/api.js`: adapter HTTP/SSE, cùng origin mặc định. Không có rule cấp XP/RC phía client.
- `server/index.js`: Node HTTP, cookie HttpOnly/SameSite, auth/session, rate limit login, SSE, static production serving.
- `server/engine.js`: SQLite + WAL, transaction `BEGIN IMMEDIATE`, rule economy/RBAC và audit; state JSON một row để giao dịch xuyên wallet/inventory/task/audit nguyên tử trong local build.
- `shared/catalog.js`: seed item, rarity, pricing, rewards và level formula.

External services chưa được dùng. Adapter có thể thay; khi chuyển lên production cần thiết kế persistence/migration/hosting phù hợp. Cấu hình Vercel/Supabase từ lượt trước còn trong repo nhưng không có deployment mới trong lượt economy này.
