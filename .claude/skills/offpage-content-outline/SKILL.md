---
name: offpage-content-outline
description: Lên outline 2-3 H2 cho 1 bài báo/guest post sao cho anchor text và link tương ứng (1 hoặc 1 cặp anchor đã được ghép/gán) có thể chèn vào một cách tự nhiên theo đúng ngữ cảnh. Dùng sau khi PM đã chốt domain + anchor text cho từng bài, trước khi viết content hoàn chỉnh.
license: Internal use only
allowed-tools: Read
metadata:
  category: seo-offpage-content
  author: agent-offpage-content
---

# Lên outline chèn anchor tự nhiên

## Mục đích
Trước khi viết nội dung đầy đủ, cần xác định góc nhìn bài viết và cấu trúc H2 sao cho mỗi anchor text có ít nhất 1 đoạn/H2 làm "bối cảnh" hợp lý để chèn link — tránh tình trạng viết xong bài mới cố nhét anchor vào chỗ không liên quan.

## Input yêu cầu
- 1 hoặc 1 cặp anchor text đã được gán cho bài này (output của `anchor-text-clustering` + `news-budget-selection`/`guestpost-budget-selection`), kèm URL đích tương ứng.
- Domain sẽ đăng bài + ràng buộc riêng của domain đó: giới hạn số từ, số ảnh, có được dùng link trần không, có giới hạn chủ đề không (lấy từ Note trong `news-domain-filter`/`guestpost-domain-filter`).

## Quy trình chi tiết từng bước

### Bước 1 — Xác định góc nhìn bài viết (content angle)
Từ 1-2 anchor text đã gán, xác định 1 chủ đề bài viết bao trùm được cả 2 (đã được xác nhận là ghép được ở bước `anchor-text-clustering`, nếu là 2 anchor). Chủ đề bài viết KHÔNG phải là chính anchor text — thường là dạng bài hướng dẫn/kiến thức/tổng hợp mà anchor text xuất hiện như 1 phần giải pháp/tham khảo tự nhiên trong đó (VD: anchor "xì mủ cây có múi" → góc nhìn bài "Các bệnh thường gặp trên cây có múi và cách xử lý", không viết bài y hệt tiêu đề = anchor text).

### Bước 2 — Phác 2-3 H2
Chia bài thành 2-3 H2, mỗi H2 phục vụ 1 phần của góc nhìn đã chọn ở Bước 1. Với mỗi anchor cần chèn, xác định rõ **H2 nào sẽ chứa đoạn văn chèn anchor đó** — 1 anchor nên nằm trong ngữ cảnh của đúng 1 H2, không rải link về cùng 1 URL ở nhiều H2 khác nhau.

Cấu trúc gợi ý (không bắt buộc theo đúng thứ tự, điều chỉnh theo góc nhìn bài viết):
1. **H2 mở đầu/nhận diện vấn đề** — giới thiệu bối cảnh chung.
2. **H2 nội dung chính chứa anchor** — mô tả chi tiết đúng phần mà anchor text đang nói tới, đây là nơi chèn link tự nhiên nhất.
3. **H2 mở rộng/anchor thứ 2 (nếu có) hoặc lời khuyên/tổng kết** — nếu bài có 2 anchor khác ngữ cảnh con (nhưng cùng nhóm lớn, đã qua kiểm tra ghép được), tách riêng H2 cho anchor thứ 2; nếu chỉ có 1 anchor, dùng H2 này để tổng kết/kêu gọi hành động.

### Bước 3 — Xác định vị trí chèn cụ thể trong từng H2
Với mỗi H2 có anchor, ghi rõ: câu/đoạn nào ngay trước vị trí chèn cần dẫn dắt thế nào để anchor xuất hiện như 1 cụm từ tự nhiên trong câu (không phải danh sách liệt kê trơ trọi kiểu "Tham khảo thêm: [anchor text]").

### Bước 4 — Xuất outline
Output dạng:
```
Góc nhìn bài viết: [mô tả 1 câu]
Ràng buộc domain: [số từ / số ảnh / link trần hay không]

H2.1: [tiêu đề]
  - Nội dung: [ý chính, không chứa anchor]

H2.2: [tiêu đề]
  - Nội dung: [ý chính]
  - Chèn anchor: "[anchor text]" -> [URL]
  - Ngữ cảnh chèn: [mô tả câu dẫn trước anchor]

H2.3: [tiêu đề]
  - Nội dung / Chèn anchor (nếu có anchor thứ 2)
```

## Lỗi thường gặp & cách xử lý
- **Góc nhìn bài viết trùng y hệt anchor text** (VD tiêu đề = "xì mủ cây có múi"): làm bài đọc như trang bán hàng SEO lộ liễu — luôn mở rộng góc nhìn thành dạng hướng dẫn/kiến thức bao trùm hơn.
- **2 anchor được gán nhưng không có H2 chung hợp lý dù đã qua bước ghép**: quay lại xác nhận với `anchor-text-clustering` xem có bị gán nhầm không, không tự ý ép 2 anchor vào chung 1 H2 nếu ngữ cảnh không tự nhiên.
- **Domain giới hạn số từ thấp (VD <500-800 từ) nhưng có 2 anchor**: rút gọn còn 2 H2 thay vì 3, đảm bảo mỗi anchor vẫn có đủ ngữ cảnh dù bài ngắn.

## Tiêu chí chất lượng tự kiểm
- [ ] Góc nhìn bài viết không trùng y hệt anchor text.
- [ ] Mỗi anchor được gán rõ vào đúng 1 H2, không rải nhiều nơi.
- [ ] Outline tuân thủ giới hạn số từ/ảnh của domain (đủ H2 để lấp đầy nhưng không vượt quá).
- [ ] Mỗi vị trí chèn anchor đều có mô tả ngữ cảnh câu dẫn, không chỉ ghi "chèn ở đây".
