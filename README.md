# T-RED WORLD

Game văn phòng pixel top-down bằng Vite + TypeScript/Canvas. Bản cập nhật này giữ bản đồ/điều khiển hiện có và tích hợp economy local có backend thực, SQLite và realtime. Local không cần API key. Bản deploy dùng Vercel Functions và Supabase; xem CLOUD_SETUP.md.

## Chạy

Yêu cầu **Node.js 24** (dùng `node:sqlite` tích hợp).

```bash
npm ci
npm run dev
```

Mở **http://localhost:5173**. Lệnh này chạy Vite và API/SSE tại `127.0.0.1:3001`. Để thử trên điện thoại cùng mạng LAN, mở `http://<IP-máy-chạy>:5173`; máy cần cho phép kết nối cổng 5173. Chỉ dùng mạng tin cậy vì có tài khoản demo công khai.

Chạy bản build:

```bash
npm run build
npm start
```

Mở `http://localhost:3001`. Để phục vụ điện thoại trong LAN: `HOST=0.0.0.0 npm start`. Cài PWA và service worker cần HTTPS (hoặc localhost); HTTP LAN vẫn chơi được nhưng không đảm bảo cài PWA. Không claim đã thử trên thiết bị iOS/Android thật.

## Tài khoản mẫu

Mật khẩu chung: **`tred-demo-2026`**.

| ID | Nhân vật | Quyền |
|---|---|---|
| `thinh` | Thịnh — Director | Founder |
| `tuyen` | Tuyền — Accountant | Accounting |
| `hung` | Hưng — Technical Lead | Manager |
| `hai` | Hải — Media Manager | Manager |
| `dan` | Dân — Fotobooth Lead Trainee | Employee |
| `xinh` | Xinh — Fotobooth Technician | Employee |
| `huy` | Huy Trần — Photographer / Retoucher | Employee |
| `muoi` | Muội — Editor / Content | Employee |
| `freelancer` | Cộng tác viên mẫu | Freelancer |
| `visitor` | Khách tham quan | Visitor |

Các nhân sự seed nhận **120 RC mẫu**, ghi rõ trong sổ cái, cùng áo/bàn/giày cơ bản. Đây không phải thu nhập thực hay mức thưởng hàng tháng. Nhân sự mới do Founder tạo nhận **0 RC**, XP 0 và trang bị cơ bản miễn phí.

Dùng hai trình duyệt hoặc một cửa sổ thường + một cửa sổ ẩn danh để đăng nhập hai người. Các tab cùng profile trình duyệt chia sẻ cookie đăng nhập.

## Luồng trải nghiệm

1. Đăng nhập `dan`, đi bằng WASD/mũi tên hoặc chạm-kéo; pinch hoặc nút −/+ để zoom. Chạm bàn để xem setup, nút bản đồ xem minimap.
2. Check-in tại văn phòng hoặc onsite nhận 2 XP, 0 RC. Một lần/ngày theo Asia/Ho_Chi_Minh; check-out kết thúc ca. Đây là ca mẫu được xác nhận bằng tài khoản local, chưa xác minh chấm công thực tế.
3. Mở Nhiệm vụ → hoàn tất checklist, viết minh chứng, tùy chọn chọn/chụp ảnh → Gửi duyệt.
4. Ở phiên khác đăng nhập `thinh` → Hồ sơ → Quản trị → chọn nhiệm vụ đang chờ → duyệt 100% hoặc 120% có căn cứ. Không tự duyệt.
5. XP/RC cập nhật trên HUD qua server. Mở RED Store, lọc danh mục/rarity/tên → preview → mua → trang bị. Inventory hỗ trợ tháo.
6. Mũ, kính, áo, giày thay đổi trên nhân vật; pet theo nhân vật; xe đã chọn xuất hiện ở parking. Workstation dựng từ item đã trang bị, cho chủ sở hữu chỉnh vị trí; Founder có thể sắp xếp lại item đã trang bị của người khác.
7. Founder/Accounting xem economy, sổ cái, audit, chỉnh giá/ẩn item, thưởng, giới hạn nhiệm vụ phụ, điều chỉnh ví có lý do và hủy nhiệm vụ bằng bút toán hoàn RC.
8. Founder quản lý nhân sự/role; Manager giao/duyệt nhiệm vụ và xem ca. Employee/Freelancer/Visitor không truy cập API Admin.

## Economy

- `shared/catalog.js`: 220 item (11 danh mục × 4 tier × 5 thiết kế), 48 xe (12 dòng × 4 tier), 20 pet; giá mặc định đúng bảng yêu cầu, không nằm trong UI.
- Level N: `25 * N * (N - 1)` tổng XP; không giới hạn level cứng. XP không tiêu khi mua và không tự thưởng RC khi lên cấp.
- Thưởng chỉ phát khi duyệt. Task ID, assignee, reviewer, checklist, ảnh/mô tả, hạn, lịch sử, reward transaction được lưu.
- 0%/100%/120%, không tự duyệt, tiêu chí xuất sắc, cooldown, max/ngày; task phụ tối đa 60 RC/ngày; task chính không chịu cap phụ.
- Nhiệm vụ đánh dấu sửa lỗi do người thực hiện gây ra không được phát thưởng.
- Purchase kiểm tra giá, số dư, ownership trong giao dịch SQLite; idempotency key gắn actor + payload. Không có endpoint client-set-XP/RC, chuyển tiền hoặc rút tiền.
- Hủy task đã thưởng tạo reversal RC có lý do; giữ XP tích lũy. Nếu không đủ RC hoàn, thao tác bị từ chối toàn bộ để tránh âm ví; kế toán cần giải quyết riêng.
- Chỉ số 30 ngày: XP/RC kiếm, RC tiêu, giờ và cơ hội giao việc, RC/giờ, tham gia nhiệm vụ, từ chối, thời gian mua lần đầu, dự báo tiết kiệm Epic/Legendary, RC lưu thông, sử dụng Store. Dữ liệu ít không tạo ra dự báo giả; hiển thị `—` khi chưa có thưởng.

## Lưu trữ, cấu hình và adapter

- Database: `data/game.sqlite` (WAL), tự tạo seed lần đầu. Database, `.env*`, `.vercel/` không đưa vào Git. Restart không reset ví/inventory/task/audit.
- Sao lưu: dừng server rồi sao chép thư mục `data/`. Để tạo DB thử nghiệm riêng: `GAME_DB=/path/test.sqlite npm start`. Không xóa DB thật để chạy test; tests luôn dùng DB tạm.
- `PORT` (mặc định 3001), `HOST` (mặc định 127.0.0.1), `GAME_DB`, `COOKIE_SECURE=1` khi phục vụ HTTPS.
- `src/api.js`: adapter `login/state/action/subscribe/position`; mặc định `/api` cùng origin. `VITE_GAME_API_URL` tùy chọn nếu backend tương thích đã cấu hình CORS/cookie/HTTPS, ưu tiên reverse proxy cùng origin.
- `server/engine.js`: rules server và persistence boundary. Có thể thay repository SQLite/transport mà giữ contract và gameplay.
- `src/item-art.js`: sprite Canvas nguyên bản trên lưới pixel; biến thể palette, silhouette, chi tiết và aura. Không dùng ảnh tham chiếu làm background.
- `src/supabase.ts` và cấu hình Supabase cũ được giữ nhưng không import vào gameplay mới. Không kết nối Supabase/Lark/API bên ngoài trong lượt này.

## Kiểm thử

```bash
npm test
npm run build
npm run test:browser
```

Browser test cần Chromium. Mặc định `/usr/bin/chromium`; có thể đặt `CHROMIUM_PATH`. Test tự mở server và SQLite tạm, không đụng DB người chơi; kiểm tra 2 phiên độc lập, di chuyển realtime, gửi ảnh/checklist, duyệt thưởng, ví, mua/trang bị/reload, pet, xe, workstation, phân quyền và 5 viewport. Screenshot ở `work/screenshots/`.

## Giới hạn đã biết

- Đây là backend local cho trải nghiệm/kiểm thử, không phải bản production công khai: tài khoản demo đã công bố, chưa có OAuth, email/reset password, quản lý upload production, migration schema chuyên dụng hay hạ tầng vận hành. DB hiện lưu trạng thái JSON trong transaction SQLite, phù hợp quy mô local; chưa benchmark 40–60 người đồng thời.
- Bản cloud triển khai cả API Vercel và persistence Supabase; local vẫn dùng SQLite riêng. Xem CLOUD_SETUP.md để tiếp tục trên PC/Codex Cloud.
- Giữ bản đồ 16 bàn hiện có; chưa mở rộng toàn bộ kiến trúc văn phòng 40–60 bàn. Tạo nhân sự mới được nhưng chưa tự thêm bàn tương ứng.
- Sprite nguyên bản đơn giản hơn ảnh concept; không tuyên bố đạt chi tiết minh họa tham chiếu. Có đi bộ và overlay trang bị/aura; chưa đủ bộ animation 8 hướng/Sit/Interact/Emote và đầy đủ trạng thái ngủ/ngồi của pet.
- Realtime đồng bộ vị trí, trạng thái, outfit, workstation, pet, xe trong local; vị trí di chuyển là presence tạm, không khôi phục vị trí cuối sau restart. Chưa có chat/cử chỉ hoặc offline mutation queue.
- Offline shell có cache; giao dịch/đăng nhập/nhiệm vụ vẫn cần backend online. Không ghi điểm hoặc RC giả khi mất mạng.
- Kiểm thử mobile là Chromium với viewport/touch mô phỏng, chưa xác nhận PWA installation, camera thật, hiệu năng pin và FPS trên điện thoại thật.

## Tài khoản test quản trị

Chọn **Admin Test**, hoặc nhập ID **admin**, mật khẩu **admin**. Tài khoản có quyền Founder và mua vật phẩm không trừ RC; quyền này được kiểm tra trên server và chỉ áp dụng cho ID admin. Giám đốc Thịnh có ngân sách setup ban đầu 1.000.000 RC. Nhân sự thường dùng bộ bàn/ghế/case/màn hình cơ bản và tự mua nâng cấp; đồ đã mua trước đó được giữ nguyên.
