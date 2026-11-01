# T-RED WORLD — quản lý chất lượng asset

Hai nguồn đã đọc và tích hợp, cố định phiên bản để hướng dẫn không tự thay đổi giữa các lần cập nhật:

| Skill | Phiên bản | Áp dụng trong dự án |
| --- | --- | --- |
| [agent-skill-pixel-art](https://github.com/ervareza/agent-skill-pixel-art) | `0de5e49` | Bản MIT tại `.agents/skills/pixel-art`; kiểm tra alpha, màu, pixel lẻ, xuất ảnh và palette trước khi tạo asset |
| [sprite-pipeline](https://github.com/kevinoldching/codex-plugins/tree/main/plugins/game-studio/skills/sprite-pipeline) | `33bd952` | Adapter tại `.agents/skills/sprite-pipeline`; seed chuẩn, tạo nguyên strip, một scale/origin/anchor, khóa frame đầu, preview trong engine |

Điểm vào chung là [.agents/skills/tred-asset-quality/SKILL.md](.agents/skills/tred-asset-quality/SKILL.md). Commit và hash hướng dẫn upstream được ghi trong `.agents/skills/upstream-lock.json`. Quy trình được tích hợp trong repository, không khai báo đã cài hai plugin toàn cục.

## Kết quả nghiên cứu nguồn

Mốc khôi phục trước sửa: `19eddfc`. Đã lưu archive, trạng thái Git và ảnh desktop/mobile dưới `work/quality-restoration/20261101T024450Z/`.

- `wear-shirt`, `wear-hat`, `wear-shoes`, `wear-glasses` từ nhánh đã phát hành `9ebd515` có đủ năm thiết kế riêng. Renderer trước sửa bỏ qua chúng và dùng một sheet chung đổi màu; đã nối lại ảnh gốc cùng native regions.
- Giữ hai base `characters-cardinal` vì có đủ bốn hướng, thay vì quay về các góc chéo/crop thiếu trong sheet nhân sự cũ. Giữ trọn vehicle/pet atlas gốc và vùng cắt đã hiệu chỉnh.
- Giữ cảnh văn phòng không có bàn cá nhân vẽ sẵn và bàn/màn hình thẳng. Những bản tham chiếu khác vẫn còn trong Git và thư mục art.
- Không PNG gốc nào bị resize, quantize hoặc ghi đè trong đợt sửa này. 16 master có kích thước, SHA-256, xuất xứ và profile trong `public/art/quality-manifest.json`.

Kiểm tra upstream nghiêm ngặt hiện báo **0/16 master đạt**: nguồn cũ có nhiều màu, alpha bán trong suốt và một số pixel lẻ. Nhiều pixel trong lòng sprite có alpha 252–253 ngay từ bản nguồn. Đây là nợ nguồn ảnh được báo thật, không được đổi thành “pass” vì build thành công. Không ép bảng màu 16/32 màu lên toàn bộ ảnh cũ vì sẽ làm mất chi tiết và màu thiết kế mà người dùng yêu cầu giữ.

Profile `legacy-reference` chỉ áp dụng cho đúng hash nguồn đã lưu. Thay ảnh hoặc thêm ảnh mới phải dùng profile `strict`; ngoại lệ không tự đi theo ảnh thay thế.

Đợt sửa bàn làm việc/trang phục ngày 2026-11-01 bổ sung `chairs-rear.png`: năm ghế nhìn từ sau, 33 màu trong palette khóa 36 màu, alpha nhị phân và không pixel lẻ. Đây là một asset **strict** mới; 16 master gốc giữ nguyên hash và nợ chất lượng đã báo ở trên. Bản sinh gốc cùng cấu hình xuất nằm trong `art-source/`; không lấy ảnh preview làm master. Điểm cổ/gấu áo và mặt tiếp xúc bàn được mô tả trong ART_PIPELINE.md. Bằng chứng mới: `work/quality-restoration/workstation-wearable-v1/verification-final/`.

## Kiểm tra và chuẩn hóa

```sh
npm run assets:check        # integrity, native rectangles, 4 hướng, rig và tư thế
npm run assets:audit        # đọc ảnh; báo rõ legacy-issues, không sửa master
npm run test:pipeline       # kiểm thử sửa alpha/palette, scale/anchor và bảo toàn
npm run test:assets         # render đồ mặc, xe và thao tác lên/xuống xe
npm run test:graphics       # desktop/mobile, DPR, zoom, preview và chữ
```

Build chạy `assets:check` tự động. Node dùng `pngjs` cho gate pixel của asset strict; production không cần Python. Công cụ chuẩn hóa/audit phát triển dùng Pillow: `python -m pip install -r .agents/skills/pixel-art/requirements.txt` nếu môi trường chưa có.

Asset mới phải khai báo trong manifest: `quality: strict`, PNG gốc, palette đã khóa, `frameSize`, `columns`, `rows`, một `anchor`, kích thước/hash và xuất xứ. Gate chặn alpha không phải 0/255, màu ngoài palette, pixel đơn lẻ, bố cục sheet không khớp hoặc anchor ngoài frame. Thứ tự game là **Front/down, Back/up, Left, Right**; ví dụ row order trong skill ngoài phải được ánh xạ, không sao chép nguyên trạng.

Ví dụ chuẩn hóa một strip đã tạo từ seed:

```sh
npm run assets:normalize -- \
  --input work/assets/raw/front-walk.png \
  --seed work/assets/seeds/front-idle.png \
  --palette work/assets/palettes/character.json \
  --frames 4 --width 64 --height 64 --direction front \
  --lock-frame1 --output work/assets/candidates/front-walk-v1
```

Kích thước là ví dụ; chọn theo seed và mục tiêu render. Seed phải đạt palette/alpha đã khóa trước khi nhân animation. Công cụ sửa alpha/palette của **candidate**, dùng một hệ số scale và cùng gốc tọa độ của slot cho mọi frame, giữ vị trí tay/chân bất đối xứng và tạo `candidate.json`. Khác với việc trim rồi căn giữa từng frame, cách này không làm nhân vật trượt ngang khi tay vươn ra. Nếu frame vượt canvas ở tỷ lệ chuẩn, công cụ báo lỗi thay vì thu nhỏ riêng frame đó. Bản cũ, candidate đã có và `public/art` không thể bị ghi đè bởi công cụ này.

Tạo cả strip trong một lần sinh ảnh từ seed; không sinh từng frame rời. Kiểm tra hình ở kích thước thật và animation trong engine trước khi cập nhật atlas/index. Quy trình không tự mua đồ, đổi inventory hoặc sửa database.

## Render và người lái

- Canvas tính mật độ màn hình, giới hạn DPR 3 để kiểm soát bộ nhớ. Zoom và camera theo pixel vật lý; thao tác chuột/chạm dùng tọa độ CSS qua chung một phép chiếu.
- Nhân vật/xe được ghép trong cache ở độ phân giải cao hơn world; thumbnail xuất trực tiếp từ master ở 256 px. UI và nhãn tên dùng chữ/vector ở tọa độ màn hình.
- Thân người lái chiếu về tay lái theo saddle/grips riêng từng mẫu; đầu không bị kéo méo. Loại phần quần đứng, dùng màu tay áo thật, lộ cẳng tay cho áo ngắn và gắn một chiếc giày cho mỗi chân.
- Xe đạp có nhịp đạp; xe máy/mô tô dùng gác chân; ô tô chỉ lộ phần người trong mặt nạ kính. Mọi lớp dùng chung root/hướng; giữ nguyên collision và trạng thái ride/park do server quyết định.

## Xác minh và preview

Đã kiểm tra bằng Chromium ở 1440×1000 DPR 1/2, 390×844 DPR 3, 430×932 DPR 2, 844×390 DPR 2. Test kiểm tra độ phân giải thật của backing canvas/thumbnail, zoom còn hoạt động, không tràn ngang và cỡ chữ shop mobile từ 12 px. Đây là mô phỏng trình duyệt, chưa phải kiểm tra điện thoại vật lý.

Bộ render asset kiểm tra 80 tổ hợp đồ mặc, 301 vật phẩm và 1.568 tổ hợp xe/model/hướng/nhịp; đối chiếu pixel ngoài kính xe và chạy luồng lên xe → chạy → dừng → gửi xe → đi bộ. Gameplay browser kiểm tra mua/trang bị, ví/XP, persistence, check-in bằng ảnh, góc làm việc và đồng bộ hai phiên.

Trước lần sửa tiếp theo, chạy `node tests/graphics-browser.mjs --before`. Sau sửa chạy `npm run test:graphics` rồi `npm run report:graphics`. File HTML độc lập có thanh so sánh trước/sau và ảnh nguyên kích thước, lưu trong `work/quality-restoration/.../comparison.html`. Preview xe trong game: garage → **Xem tư thế lái**, hoặc `?preview=vehicles` sau đăng nhập.

## Nhóm file thay đổi

| Nhóm | File |
| --- | --- |
| Nguồn, integrity và gate | `public/art/quality-manifest.json`, `scripts/check-art.mjs`, `scripts/art-quality.mjs`, `scripts/check-asset-rigs.mjs` |
| Skill và chuẩn hóa | `.agents/skills/`, `scripts/sprite_pipeline.py`, `AGENTS.md`, `ASSET_QUALITY.md`, `ART_PIPELINE.md` |
| Renderer | `src/render-quality.js`, `src/main.ts`, `src/character-art.js`, `src/asset-rules.js`, `src/art-assets.js`, `src/vehicle-rig.js` |
| UI và preview | `src/quality.css`, `src/visuals.js`, `src/item-art.js`, `src/economy-ui.js`, `src/vehicle-preview.js` |
| Kiểm thử và báo cáo | `tests/graphics-browser.mjs`, `tests/render-quality.test.js`, `tests/art-quality.test.js`, `tests/sprite_pipeline_test.py`, `tests/economy-browser.mjs`, `scripts/graphics-report.mjs`, `package.json`, `package-lock.json` |
