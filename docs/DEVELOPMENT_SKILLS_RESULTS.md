# Checkpoint kết quả — AI Development Skills

Đã hoàn thành phần tooling/quy trình trên nhánh `codex/tred-development-skills`. Nền ban đầu là `5e2d252`; checkpoint nghiên cứu trước triển khai tooling là `2de4abb`. Engine, renderer, PNG, server/API và dữ liệu người chơi không sửa trong đợt này. Main/production chưa được merge từ nhánh này.

## Đã chọn và tích hợp

12 skill/adapter trong registry, gồm orchestrator, UI/mobile, animation/người lái, gameplay/camera/collision, performance, visual testing, Develop Web Game, Game Asset Gen có giới hạn, Vercel UI/deployment và hai adapter asset/normalization hiện có. Pixel-art upstream vẫn là reference có pin của asset workflow.

- **Game UI/UX:** chọn nguyên tắc engine-neutral, chuyển sang DOM/CSS và safe area/focus; bỏ ví dụ Godot/Unity.
- **Develop Web Game:** đọc bản cuối trước khi curated main bị xóa và script Playwright; dùng adapter cùng harness có sẵn, không thêm timer shim vào game online.
- **Game Asset Gen:** chọn seed/style/anchor/whole-strip workflow; không cài CLI dò `.env`, upload reference tới gateway hoặc chạy batch API.
- **Vercel:** chọn Web Interface Guidelines có pin rules và skill verification/deployment theo tác vụ. React/Next không áp dụng.
- **Phaser/Spine:** nghiên cứu nhưng chưa kích hoạt vì không có runtime tương ứng; yêu cầu đổi engine/runtime sẽ được router đưa sang checkpoint thiết kế.

Nguồn, hash, commit và permission nằm trong `config/skill-sources.json`; instructions/registry được kiểm tra bởi `skills:check` ngay trong build. Xem [báo cáo nghiên cứu](DEVELOPMENT_SKILLS_RESEARCH.md) và [quy trình sử dụng](../DEVELOPMENT_SKILLS.md).

## Kiểm tra thực tế

| Phần | Kết quả |
| --- | --- |
| Router tiếng Việt/Anh | Chọn một owner; rider → animation, UI/mobile → UI + Vercel, tài liệu → check nhẹ, Phaser → design checkpoint; không thực thi task thành shell |
| Source/permission lock | 12 adapter đạt; không remote installer, provider CLI, thêm dependency runtime hoặc dò credentials |
| Unit/integration | **50/50** Node tests đạt |
| Chuẩn hóa | **4/4** Python pipeline tests đạt |
| Build | Đạt; JS gzip **39.356 byte**, CSS gzip **9.282 byte**, nằm trong budget; bundle runtime giữ nguyên |
| Graphics | 5 viewport/DPR đạt; thao tác chạm ghế ở DPR 3 đúng tọa độ |
| Asset/render | 80 tổ hợp outfit, 301 item và **1.568** tổ hợp người lái đạt; roof/cabin/cuff và warm allocation checks đạt |
| Gameplay browser | Hai phiên, WASD/touch, ví/XP, mua/trang bị/reload, check-in bằng ảnh, workstation và quyền truy cập đạt; không browser runtime errors |
| Visual before/after | **20/20** scenario đạt; actor/rider gallery **0 pixel khác**; UI chỉ lệch 1/255 ở tối đa 7 pixel/ảnh, ghi đầy đủ raw/noise, không mask Canvas |
| Gate âm tính | Bắt được một pixel lỗi, thiếu ảnh, đổi kích thước, khác renderer và review lỗi thời; không cho review bỏ qua lỗi cấu trúc |
| Checkpoint/rollback | Thử trên repo fixture: giữ dirty/untracked/deleted source, từ chối output trùng, phát hiện snapshot bị sửa; recovery worktree không đổi DB/workspace gốc |
| Cách ly fixture | Tắt đọc `.env`, ép API same-origin/SSE, chặn browser HTTP ngoài fixture; DB thử nghiệm riêng |

Lượt verify đầu đã dừng vì fixture mới lặp `/api` ở URL đăng nhập. Đã sửa contract của harness và bổ sung assertion `/api/login`; lượt đầy đủ sau đó đạt. Log thất bại được giữ lại, không sửa baseline hoặc làm xanh báo cáo lỗi cũ.

## Bằng chứng và review

Artifacts tại `work/development-skills/20261101T032143Z/`:

- `checkpoint-0.json`, `source-before.tar`: mốc nguồn gốc.
- `checkpoint-2/`: snapshot nguồn gồm cả thay đổi chưa commit và file mới.
- `visual-before-final/`: baseline, source runtime hash và 20 PNG.
- `verification-passing/plan.json`: skill/check đã chọn.
- `verification-passing/verification.json`: bảy nhóm kiểm tra đã đạt và đường log.
- `verification-passing/comparison/comparison.html`: before/after/diff độc lập.
- `verification-passing/comparison/comparison.json.review.json`: review gắn hash, ghi rõ gallery nam/nữ, xe, fitting/workstation đã xem.

Đã xem trực tiếp ảnh world desktop, shop/fitting/workstation mobile, gallery outfit và rider. Review không có nghĩa là mọi PNG cũ đạt strict pixel-art: 16 master legacy vẫn được giữ và báo nợ alpha/palette. Không có kết quả điện thoại vật lý, FPS/pin hoặc benchmark nhiều người; chưa cài Git hook/CI dịch vụ ngoài và chưa triển khai engine mới.

## File thay đổi theo nhóm

- Hướng dẫn và handoff: `AGENTS.md`, `DEVELOPMENT_SKILLS.md`, `docs/DEVELOPMENT_SKILLS_*.md`, `progress.md`.
- Skill: các adapter mới trong `.agents/skills/`; giữ nguyên upstream pixel-art và asset/normalization đã có.
- Registry/provenance: `config/development-skills.json`, `config/development-skills.lock.json`, `config/skill-sources.json`.
- Tools: `scripts/skill-router.mjs`, `check-development-skills.mjs`, `dev-checkpoint.mjs`, `dev-evidence.mjs`, `verify-development.mjs`, `visual-evidence.mjs`, `visual-regression.mjs`, `visual-self-check.mjs`.
- Tests: `tests/development-skills.test.js`, `fixture-policy.mjs`, `visual-capture.mjs`; dùng fixture cách ly cho browser/graphics/asset tests hiện có.
- NPM: script chọn skill, checkpoint, verify, capture/compare/review/check; không thêm package.

Thay đổi lớn tiếp theo cần một checkpoint thiết kế riêng theo báo cáo nghiên cứu. Những vấn đề runtime cũ được ghi nhận để xử lý có số đo và bằng chứng riêng; không được sửa ngoài phạm vi chỉ vì một skill đề xuất.
