# Economy đã triển khai

Nguồn chuẩn: `shared/catalog.js` (rarity, giá, level, rewards), `server/engine.js` (quy tắc và giao dịch).

SQLite kiểm tra ví và ownership trong `BEGIN IMMEDIATE`; mọi thay đổi kinh tế có audit. User chỉ gửi intent, không gửi số dư hoặc XP để server tin tưởng. Replay cùng idempotency key/payload trả kết quả cũ; khác payload bị từ chối.

Default task reward: care 10/20, organize 15/20, inspect 25/35, small 25/25, professional 40/40, complex 80/75, show 100/80, team 30/30, skill 150/100 (XP/RC). Check-in 2/0 một lần/ngày. 120% cần reviewer có quyền, căn cứ và không phải người làm. Nhiệm vụ phụ cap 60 RC/ngày, cooldown 24h và 1 lần/template/ngày mặc định.

Monthly target 400–700 XP, 500–900 RC là mục tiêu cân bằng, không phải grant tự động. Part-time/freelancer nhận cùng thưởng cho cùng task/chất lượng. Admin thấy giờ và cơ hội task để tránh so tổng điểm không công bằng.

Tham khảo README cho vận hành, reversal và giới hạn.
