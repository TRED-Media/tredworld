# Tiếp tục trên PC / Codex Cloud

Repo: https://github.com/TRED-Media/tredworld — branch `main`.

Trong Codex trên PC hoặc Codex Cloud, chọn repo này và branch main. Với bản clone có sẵn: `git pull --ff-only`; sau đó `npm ci` và `npm run dev`. Local tự tạo dữ liệu mẫu SQLite riêng. Không cần API key để chỉnh game và chạy test local.

Bản cloud: https://tredworld.vercel.app — frontend Vite + API Vercel Functions + Supabase project TRedWorld (`peqaklqbgjhpozdukpxu`). Local dùng SSE; cloud dùng cập nhật presence mỗi khoảng 1 giây và ghi vị trí tối đa khoảng 600ms/lần. Đây là bản test, chưa tối ưu nhiều người đồng thời.

Biến môi trường Vercel:
- `GAME_SUPABASE_URL`
- `GAME_SUPABASE_PUBLISHABLE_KEY`
- `GAME_STORE_CAPABILITY` (server-only, không dùng prefix VITE)
- `VITE_GAME_TRANSPORT=poll`

Bridge SQL trong `deployment/cloud-store.sql`: dữ liệu ở schema private, không cho browser đọc bảng. Capability 256-bit được lưu dạng SHA-256 trong DB; secret gốc chỉ ở biến môi trường Vercel. Public RPC là security invoker gọi private definer có kiểm tra capability. Quyền người chơi vẫn kiểm tra trên server.

Snapshot ghi bằng compare-and-swap revision. Nếu hai API instance cùng mua/duyệt, một bên phải đọc lại rồi áp dụng lại intent; idempotency bảo vệ giao dịch đã xử lý. SQLite trong function chỉ là bộ nhớ thực thi rules, không dùng làm lưu trữ cloud.

Dữ liệu local và cloud tách biệt sau lần seed đầu. Code đồng bộ qua GitHub; ví/nhiệm vụ trên site lưu tại Supabase, không nằm trong Git. Không coi việc push repo là đã thay đổi cấu hình tài khoản/môi trường Codex của người dùng.

Demo: `dan` (Employee), `thinh` (Founder); password `tred-demo-2026`. Chỉ dùng dữ liệu thử nghiệm trên deployment này.
