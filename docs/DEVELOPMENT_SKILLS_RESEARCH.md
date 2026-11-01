# T-RED WORLD — checkpoint 1: engine và lựa chọn skill

Mốc khảo sát: `5e2d252`. Nhánh làm việc: `codex/tred-development-skills`. Checkpoint 0 lưu Git SHA, diff và archive tại `work/development-skills/20261101T032143Z/`. Đợt này xây công cụ/quy trình phát triển; chưa chuyển engine, sửa gameplay, thay PNG hoặc deploy production.

## Engine và ranh giới hiện tại

| Thành phần | Thực tế trong repository |
| --- | --- |
| Frontend | Vite 6, TypeScript + JavaScript ESM, DOM/CSS; không React |
| Engine | Canvas 2D tự viết; `src/main.ts` sở hữu RAF, input, camera và scene composition |
| Thế giới | 1344×1248, collision AABB và lối đi trong `src/world.js`; di chuyển 4 hướng |
| Camera/input | DPR, zoom pixel vật lý và phép chiếu CSS↔world dùng `render-quality.js` |
| Nhân vật/xe | Hai base, 4 hướng, cached composition; saddle/grips/feet từng mẫu; ô tô có mặt nạ kính |
| Multiplayer | SSE local, polling cloud; actor remote nội suy chung root với xe |
| Backend | Node 24+, SQLite local; Vercel Functions + Supabase CAS trên cloud; ví/ownership do server quyết định |
| QA | Node tests, Pillow pipeline tests, Playwright gameplay/asset/graphics; chưa có gate pixel diff thực sự |

Vấn đề cần quản lý: `main.ts` trộn nhiều trách nhiệm; CSS có nhiều lớp override; vẫn ghi một số DOM mỗi frame; chưa benchmark tải nhiều người. Không tự refactor những phần này khi đang thiết lập skill. 16 master PNG cũ vẫn có nợ alpha/palette; giữ ngoại lệ theo đúng hash, không báo strict pass giả.

Screenshot hiện tại có clock, toast, RAF và thời điểm chụp thay đổi. Tên `before/after` có thể bị ghi đè nếu dùng lại thư mục. Chỉ chụp ảnh và xác nhận build không đủ để ngăn chi tiết nhỏ như mũ/giày bị hỏng. Cần snapshot bất biến, capture ổn định, diff theo môi trường và review gắn với hash ảnh.

## Nguồn và quyết định

| Nhóm/nghiên cứu | Quyết định | Lý do / quyền truy cập |
| --- | --- | --- |
| [Game UI/UX](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ui-ux) | Adapter DOM/CSS | Dùng safe area, focus, layout và cập nhật theo sự kiện; không mang ví dụ Godot/Unity hay đổi cả UI sang scale-reference bitmap. Skill và reference là Markdown, không cần network/credentials khi dùng adapter |
| [Develop Web Game](https://github.com/openai/skills/tree/30444aed500c00c85294d12074f6e3ee794f808a/skills/.curated/develop-web-game) | Adapter cho harness có sẵn | Bản curated đã bị OpenAI xóa ở commit `11c6438`; không cài đường main đang 404. Đọc bản cuối và script 357 dòng. Giữ vòng implement→act→observe, dùng Playwright hiện có; không chèn virtual-time shim vào multiplayer production |
| [OpenAI Game Playtest](https://github.com/openai/plugins/tree/main/plugins/game-studio/skills/game-playtest) | Reference chính thức bổ sung | Chọn test/browser tooling có sẵn và kiểm tra UI độc lập với Canvas; không thêm Playwright global hoặc scaffold app mới |
| [Game Asset Gen](https://github.com/haxqer/skills/tree/3fd9ba1a2fa0dac5711af0ad8c1e5bfa7a819e2c/skills/game-asset-gen) | Adapter ý tưởng, không cài generator | Đã đọc SKILL và script generation. Script dò `.env` lên thư mục cha, gửi ảnh/key tới API base URL tùy chọn và ghi output. Dùng công cụ image generation sẵn có khi nhiệm vụ thực sự cần; không nhập API key/gateway mới, không chạy batch mặc định |
| Pixel-art + sprite-pipeline | Giữ tích hợp hiện có | Master provenance, palette/alpha gate, một scale/origin cho cả strip và candidate-only output; xử lý thứ tự hướng theo game thay vì ví dụ donor |
| [Phaser Skill](https://github.com/haxqer/skills/tree/3fd9ba1a2fa0dac5711af0ad8c1e5bfa7a819e2c/skills/phaser) | Chưa kích hoạt | Skill yêu cầu Phaser 3 scene/Arcade Physics; package/runtime hiện tại không có Phaser. Cài sẽ không sửa được Canvas rig hiện tại và dẫn đến đổi kiến trúc |
| [Spine Animation](https://github.com/haxqer/skills/tree/3fd9ba1a2fa0dac5711af0ad8c1e5bfa7a819e2c/skills/spine-animation) | Chưa kích hoạt | Đã đọc SKILL và preview script. Runtime tải từ CDN, cache ngoài repo, có phụ thuộc OpenCV/numpy/Pillow và giấy phép Spine runtime. Game chưa có skeleton/atlas/loader Spine; không thêm chúng chỉ để sửa tư thế lái |
| [Vercel Web Interface Guidelines](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/web-design-guidelines) | Adapter có pin rules | Dùng hướng dẫn accessibility, touch, typography và performance cho DOM. Donor tự tải rules từ moving main mỗi lần; adapter pin [rules](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md), không fetch/chạy code tự động |
| Vercel verification/deployments | Chỉ khi tác vụ cần | Dùng skill chính thức đã kết nối khi xác minh đầy đủ luồng hoặc triển khai. Chọn project/team đã biết. Không tạo project, sửa env hoặc deploy chỉ vì sửa skill |
| Vercel React/Next/React Native | Không chọn | Không tương thích frontend DOM/Canvas hiện tại; không thêm framework để dùng skill |

Nguồn tải qua GitHub read-only. Không chạy install script, CDN player, provider API hay generator của các ứng viên. Các script đã đọc chỉ được lưu trong `work/.../research/`; adapter trong repo do dự án kiểm soát. Commit, hash và quyền được ghi trong `config/skill-sources.json`. Không coi việc có trong catalog hoặc nhiều sao là bằng chứng an toàn/tương thích.

## Kế hoạch đã chốt ở checkpoint này

1. Một orchestrator chọn theo yêu cầu và file thay đổi; một skill chủ trì, các skill hỗ trợ có phạm vi rõ.
2. Nhóm chuyên biệt: UI/mobile, asset, animation/người lái, movement/camera/collision, performance, automated testing/visual regression và deploy có điều kiện.
3. Checkpoint nguồn bất biến, test DB tạm, baseline/candidate riêng, pixel diff và review có hash. Mọi thay đổi hình ảnh phải được xem; baseline không được tự cập nhật để làm xanh test.
4. Rollback dựng một worktree phục hồi riêng từ snapshot. Không reset/clean/ghi đè workspace hiện tại hoặc data người chơi.
5. Phát hiện yêu cầu đổi engine, thêm Spine runtime hay thay protocol/persistence → lập báo cáo thiết kế và checkpoint trước. Bộ skill không tự thực hiện thay đổi lớn.

Kết quả giai đoạn sau và cách chạy được ghi tại `DEVELOPMENT_SKILLS.md`; checkpoint này là tài liệu nghiên cứu trước khi triển khai tooling.
