# Kết quả kiểm thử — 31/10/2026

## Lệnh đã chạy thành công

- `npm test`: **19/19 pass**.
- `npm run build`: TypeScript + Vite pass; JS bundle 53.80 kB (gzip 21.82 kB), CSS 15.74 kB.
- `npm run test:browser`: toàn bộ luồng Chromium pass, không có `pageerror`.

## Logic / API

Catalog 220+48+20, giá và 4 tier; công thức level; mua nguyên tử/idempotent; từ chối thiếu RC; XP không đổi khi mua; ownership/equip/pet slot; từ chối sửa workstation người khác; submit/evidence; approval role/no self-review/quality; reject/resubmit; check-in một lần/ngày; cap RC phụ và cooldown; full-time/freelancer cùng thưởng; audit/manual adjustment; reversal và rollback thiếu RC; giá/tier/ẩn item; SQLite restart; quản lý nhân sự; khách không mua; không thưởng lỗi tự gây ra.

API test dùng hai cookie session độc lập và hai SSE stream. Tám request mua cùng item với key khác nhau: đúng một thành công, một lần trừ RC. Payload client gửi thêm XP/RC không thay đổi số dư. Unauthorized nhận 401, employee gọi admin nhận 403. Logout vô hiệu hóa session.

## Trình duyệt → API → SQLite → UI

Database và port tạm, không dùng DB của môi trường đang chơi:

1. Hai context đăng nhập Dân / Thịnh; di chuyển ở một phiên nhìn thấy qua SSE ở phiên còn lại.
2. CDP touch start/move/end: nhân vật di chuyển và dừng sau thả tay.
3. Check-in → 2 XP; gửi checklist và file ảnh PNG thật → Founder duyệt → 25 XP/35 RC, cập nhật HUD của nhân viên.
4. Mua/trang bị mũ → RC giảm đúng giá, XP không đổi; reload giữ ownership/equipment.
5. Admin điều chỉnh ví có lý do → mua và trang bị pet/xe.
6. Lưu vị trí workstation; employee không có nút Admin, direct API trả 403.
7. Không tràn ngang ở 360×800, 390×844, 430×932, 844×390 và 1440×1000, cả world và Store.
8. Duyệt 12 trang Store: 288 ID, 288 ảnh render khác nhau.

Screenshot: `work/screenshots/world-mobile.png`, `store-mobile.png`, `world-desktop.png`.

## Chưa xác minh / giới hạn

Không test thiết bị điện thoại thật, camera thật, PWA install, offline gameplay mutations, 40–60 người đồng thời, tải dài ngày hoặc dịch vụ production. Test hai phiên không có nghĩa đã hoàn thiện tất cả tính năng multiplayer của master prompt. Những animation/độ chi tiết art chưa đủ được nêu trong README.

## Bổ sung triển khai cloud

- `npm test`: **22/22 pass**, thêm test compare-and-swap đồng thời, rollback khi từ chối mutation và Vercel HTTP handler (login/mua/state/presence/phân quyền) với remote store giả lập.
- `VITE_GAME_TRANSPORT=poll npm run build`: pass.
- Supabase: đã seed 10 nhân vật, 288 item, 36 nhiệm vụ; kiểm tra capability sai bị từ chối và anon không đọc trực tiếp bảng. Security advisor không còn lint sau khi tách private definer/public invoker.
- Vercel xác nhận deployment READY. Công cụ web-fetch của connector báo không truy cập được deployment; chưa kiểm thử browser end-to-end trực tiếp trên production. Không coi test adapter giả lập là kiểm thử đăng nhập trên site thật.
