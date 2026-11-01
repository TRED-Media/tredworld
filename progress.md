Original prompt: Xây dựng hệ thống AI Development Skills chuyên biệt cho T-RED WORLD; phân tích engine, nghiên cứu skill tương thích, chọn theo tác vụ, kiểm tra trực quan trước/sau và có checkpoint/rollback.

- C0: source nền `5e2d252`, workspace sạch; archive/diff tại `work/development-skills/20261101T032143Z/`. Node tests và build bản nền đạt.
- C1: commit `2de4abb` lưu nghiên cứu engine, compatibility và quyền/script trước khi triển khai tooling. Không chọn Phaser/Spine/React cho engine Canvas hiện tại.
- C2: thêm router 12 skill, permission/hash lock, checkpoint và phục hồi worktree riêng, capture ổn định 20 scenario và pixel diff/review gate. Unit test phủ một pixel lỗi, thiếu bằng chứng, resize/renderer mismatch, stale review và snapshot dirty/untracked/deleted.
- C3: verify đầy đủ đạt 7 nhóm check: 50 Node tests, 4 Python pipeline tests, build, graphics, source/rig, 1.568 rider renders và gameplay hai phiên. 20 visual scenario đạt; asset gallery exact, UI có tối đa 7 pixel lệch 1 mức màu được ghi rõ. Review và logs tại work/development-skills/20261101T032143Z/verification-passing/. Xem docs/DEVELOPMENT_SKILLS_RESULTS.md.
- Harness được cách ly khỏi .env/API production. Lượt đầu phát hiện base URL lặp /api; đã sửa và chạy lại đầy đủ. Các log lỗi cũ được giữ, không ghi đè baseline.
- Runtime, PNG master, server/API và dữ liệu người chơi không sửa trong đợt này. Source cũ vẫn còn 16 master legacy chưa đạt strict alpha/palette; không đổi trạng thái này thành pass.
- Trước tác vụ tiếp theo: đọc DEVELOPMENT_SKILLS.md, chạy skills:route, tạo checkpoint kèm visual baseline. Chỉ thay engine/runtime lớn sau checkpoint thiết kế theo yêu cầu người dùng.
