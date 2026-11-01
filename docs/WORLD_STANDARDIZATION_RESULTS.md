# T-RED WORLD — kết quả chuẩn hóa world và tương tác ghế

Nền phát hành: `ae5e206`. Checkpoint thiết kế: `38bfed2`, [kế hoạch và nguyên nhân gốc](WORLD_STANDARDIZATION_PLAN.md). Giữ engine Canvas 2D/Vite, bản đồ 1344×1248, hai base nhân vật, toàn bộ ID/ownership và cơ chế kinh tế. Các thay đổi nằm trên nhánh `codex/world-standardization`; không reset hay ghi đè nhánh main.

## Thay đổi đã kiểm tra

- **Character/item:** chuyển alpha và màu từ crop native một lần; giữ nguyên đầu/tóc thay vì cắt scalp theo hình chữ nhật. Thay vùng vải theo ngữ nghĩa, dùng một transform cho áo, giữ cổ/tay/ống quần và mở gutter vùng native. Compiler hỗ trợ trực tiếp mật độ world 2 và preview 4, giữ aspect ratio và cache có giới hạn. Xe/người lái dùng cùng compiler; kính chắn gió tiếp tục che đúng các bộ phận nằm trong cabin.
- **Environment:** xuất nền văn phòng sạch từ nguồn mới có cùng floor plan, loại bỏ haze/grid nhiễu và các ghế vẽ sẵn. Thay bằng 19 ghế độc lập; bổ sung sheet năm mẫu × bốn hướng. Nền mới 256 màu, ghế 156 màu trong palette khóa 256 màu; cả hai alpha nhị phân, không orphan. 16 PNG master cũ giữ nguyên từng byte. Chữ/UI tiếp tục render riêng ở mật độ màn hình.
- **Furniture:** ghế bàn làm việc đặt theo mặt tiếp xúc/chân bàn thực tế, gần bàn hơn; preview và world dùng cùng geometry. Custom chair có atlas bốn cột được chọn đúng hướng ở cả hai nơi, không thay bằng mẫu mặc định. Quầy lễ tân, bàn họp, bàn lounge và lưng ghế có lớp che khuất riêng.
- **Interaction:** registry chung cho 28 ghế, hit region, approach, floor, facing, occupied/free. Click/tap ghế trống tự đi theo đường cardinal tránh collision rồi ngồi. Di chuyển hủy đường đi/đứng dậy; E đứng dậy hoặc mở check-in ảnh ở ghế của chủ bàn. Dấu vuông vàng, focus coral và trạng thái occupied slate dùng chung cho ghế, góc làm việc và garage; vật tĩnh không có dấu tương tác.
- **Authority:** claim ghế kiểm tra vị trí từ presence đã xác thực, dùng transaction/CAS chống hai người chiếm cùng ghế và lease 45 giây gia hạn định kỳ, kể cả khi mở menu. Reconnect khôi phục ghế hợp lệ; lái xe/Onsite/rời ghế giải phóng chỗ. Ngồi thông thường không đổi RC, XP, inventory, status hay ca làm. Không migration SQL, không đổi cấu hình production hay dependency.

## Kiểm tra thực tế

Lượt cuối: `work/world-standardization/v1/verification-final-v3/`.

| Nhóm kiểm tra | Kết quả |
| --- | --- |
| Node | 61/61 đạt; gồm đường tới mọi ghế, tiến đường đi với dt lẻ, TTL, API hai phiên và cloud CAS contention |
| Build | TypeScript + Vite production đạt; JS gzip 47,06 KB, CSS gzip 9,38 KB |
| Source/rig/world contract | 19 master đúng hash/layout; 80 vùng garment, 32 crop xe/pet, 12 mount; 20 frame ghế đủ gutter; 28 approach không va chạm |
| Python pipeline | 4/4 đạt |
| Asset browser | 80 outfit/model/direction/animation, 25 cụm bàn ghế, 301 item render, 1.568 rider render; cabin/roof, anatomy, cuff và warm-frame allocation đạt |
| Graphics | Desktop 1440×1000 DPR 1/2, mobile 390×844 DPR 3, 430×932 DPR 2, landscape 844×390 DPR 2 đạt |
| Gameplay browser | Hai phiên realtime, touch, mua/trang bị/reload, nhiệm vụ/duyệt, layout, check-in ảnh và quyền admin đạt; không lỗi runtime |
| Office browser | 80 surface ở hai density không cắt đầu/cạnh, không alpha lẻ; bốn view custom chair đúng atlas; 9 lần click/tap ngồi thành công ở nhiều khu vực; occupied/reconnect/cancel/stand/mobile/check-in ảnh đạt |
| Visual regression | 20/20 ảnh before/after/diff được mở xem và review gắn hash; `visual:check` đạt |
| Re-export | Hai export mới tái tạo byte-for-byte từ raw source và palette khóa; hash khớp master đang dùng |

Vòng lỗi trước được giữ lại: alpha lẻ do clipping, phím nhấn nhanh không rời ghế, navigation dừng ở góc do sai số số thực và assertion đọc DOM trước RAF. Đã sửa nguyên nhân tương ứng, thêm regression phù hợp và chạy lại. Không đổi baseline để che lỗi. Lượt v2 đạt kiểm tra hành vi; v3 bổ sung custom-chair routing, với cả 20 ảnh PNG trùng hash v2 đã xem. Bằng chứng parity tại `work/world-standardization/v1/review-image-parity-v2-v3.json`.

## Preview và phục hồi

- So sánh toàn bộ: `work/world-standardization/v1/verification-final-v3/comparison/comparison.html` (độc lập, có ảnh nhúng).
- Nhân vật: `verification-final-v3/visual-after/actors.png`; xe: `riders-0/7/14/21.png` trong cùng thư mục.
- Item bốn hướng, năm loại ghế × bốn hướng × hai nhân vật: `verification-final-v3/office/item-four-directions.png` và `seated-gallery.png`.
- Ảnh ngồi thật: `office/seated-*.png`, `mobile-seated.png`; affordance: `highlight-free.png`, `highlight-occupied.png`.
- Checkpoint trước sửa: `work/world-standardization/v1/checkpoint/`; checkpoint giữa giai đoạn: `checkpoint-interaction/`; checkpoint nguồn cuối: `checkpoint-reviewed/`.

Rollback nguồn tạo worktree riêng, không đụng workspace hay DB đang dùng:

```sh
npm run dev:checkpoint -- restore \
  --checkpoint work/world-standardization/v1/checkpoint \
  --output work/world-standardization/recovery-baseline
```

## Giới hạn xác minh

Đây là Chromium desktop/mobile emulation và fixture DB tạm, chưa phải điện thoại vật lý hay benchmark FPS trên thiết bị thật. Cloud CAS được kiểm tra bằng bridge giả lập, không dùng dữ liệu Supabase production để chạy test. READY/alias của deployment được báo riêng với kết quả truy cập HTTP thực tế.

Nguồn legacy vẫn có nợ palette/alpha; normalization runtime không biến chúng thành master strict. Hướng nhìn bốn phía áp dụng cho nhân vật, wearable, xe/rider và ghế. Pet giữ pose gốc, vật dụng tĩnh giữ góc nhìn được thiết kế; đợt này không tạo mới bốn sprite cho mọi pet/decor. Không tuyên bố đã vẽ lại toàn bộ catalog.

## Danh sách file

Danh sách đầy đủ các file thêm/sửa so với nền `ae5e206` nằm dưới đây; artifact QA, DB, credentials và dependency lock không được đưa vào commit.

- `ART_PIPELINE.md`
- `ASSET_QUALITY.md`
- `api/game.js`
- `art-source/chairs-cardinal.generated.png`
- `art-source/office-standard.generated.png`
- `art-source/world-standardization.json`
- `config/development-skills.json`
- `config/development-skills.lock.json`
- `config/world-art-contract.json`
- `docs/WORLD_STANDARDIZATION_PLAN.md`
- `docs/WORLD_STANDARDIZATION_RESULTS.md`
- `package.json`
- `progress.md`
- `public/art/chairs-cardinal.png`
- `public/art/office-standard.png`
- `public/art/quality-manifest.json`
- `scripts/check-world-contract.mjs`
- `scripts/standardize-chair-sheet.mjs`
- `scripts/standardize-world-art.mjs`
- `scripts/verify-development.mjs`
- `server/engine.js`
- `server/index.js`
- `shared/presence.js`
- `src/art-assets.js`
- `src/asset-rules.js`
- `src/character-art.js`
- `src/main.ts`
- `src/material-standard.js`
- `src/office-interactions.js`
- `src/office-render.js`
- `src/office-seats.js`
- `src/pathfinding.js`
- `src/pixel-palette.js`
- `src/quality.css`
- `src/render-quality.js`
- `src/seat-controller.js`
- `src/sprite-fit.js`
- `src/workstation-layout.js`
- `src/world.js`
- `tests/appearance-browser.mjs`
- `tests/economy-browser.mjs`
- `tests/graphics-browser.mjs`
- `tests/office-browser.mjs`
- `tests/office-interaction.test.js`
- `tests/seating-api.test.js`
- `tests/visual-capture.mjs`
