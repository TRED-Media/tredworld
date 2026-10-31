# Catalog đã tích hợp

`shared/catalog.js` là cấu hình mặc định dùng để seed SQLite.

- 11 danh mục × 20 = **220**: áo, kính, mũ, giày, case, monitor, cooling, desk, chair, decor, accessory.
- Mỗi danh mục có 5 thiết kế/tier × đúng 4 rarity.
- 12 dòng xe × 4 rarity = **48**; hệ số 1 / 1.3 / 1.8 / 2.5, làm tròn 10 RC.
- **20 pet** với tên/giá theo yêu cầu, một slot pet hoạt động.
- Tổng **288**; IDs duy nhất. Browser test so sánh Data URL xác nhận 288 sprite khác nhau.

Hình ảnh sinh bằng integer-grid Canvas từ `src/item-art.js`. Tier tăng trim/hardware, RGB, pixel aura; có công tắc aura. Không item nào tăng XP/RC. Giá runtime có thể đổi bởi Founder/Accounting có lý do; seed không ghi đè giá đang vận hành.
