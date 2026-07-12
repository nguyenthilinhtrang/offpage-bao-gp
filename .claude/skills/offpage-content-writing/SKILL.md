---
name: offpage-content-writing
description: Viết nội dung hoàn chỉnh (2-3 H2) cho bài báo/guest post dựa trên outline đã có, chèn anchor text và link tương ứng một cách tự nhiên vào đúng ngữ cảnh, tuân thủ giới hạn số từ/ảnh và các ràng buộc riêng của domain. Dùng sau khi đã có outline từ skill offpage-content-outline.
license: Internal use only
allowed-tools: Read, Write
metadata:
  category: seo-offpage-content
  author: agent-offpage-content
---

# Viết content chèn anchor tự nhiên

## Mục đích
Biến outline (từ skill `offpage-content-outline`) thành bài viết hoàn chỉnh, đúng văn phong báo chí/blog thông thường, KHÔNG đọc như bài SEO nhồi nhét từ khoá — anchor text phải nằm trong câu văn tự nhiên như một gợi ý tham khảo hợp lý cho người đọc.

## Input yêu cầu
- Outline đầy đủ từ `offpage-content-outline` (góc nhìn bài viết, cấu trúc H2, vị trí chèn từng anchor).
- Ràng buộc domain: giới hạn số từ, số ảnh, được/không được dùng link trần, các note đặc thù khác (VD "không dùng link trần" → phải chèn anchor dưới dạng cụm từ có nghĩa, không dán URL trần vào bài).

## Quy trình chi tiết từng bước

### Bước 1 — Viết theo đúng cấu trúc outline
Viết lần lượt từng H2 theo outline, giữ đúng thứ tự và vai trò từng H2 đã xác định (mở đầu / nội dung chính chứa anchor / mở rộng-tổng kết).

### Bước 2 — Chèn anchor đúng kỹ thuật
- Anchor text chèn dưới dạng hyperlink markdown: `[anchor text](URL)`, đặt giữa câu có ngữ cảnh dẫn dắt tự nhiên (theo mô tả "Ngữ cảnh chèn" trong outline), không đặt ở đầu câu trơ trọi hoặc trong danh sách gạch đầu dòng tách biệt khỏi mạch văn.
- Chỉ chèn link tại đúng vị trí đã xác định trong outline — không thêm anchor ở H2 khác để "cho chắc".
- Nếu domain ghi "không dùng link trần": không hiển thị URL dạng thô, luôn bọc trong cụm từ có nghĩa.

### Bước 3 — Kiểm tra tuân thủ ràng buộc domain
- Đếm số từ thực tế, đối chiếu với giới hạn (VD "<1000 từ") — cắt gọn nếu vượt, không để dư quá nhiều so với giới hạn.
- Đề xuất số lượng ảnh cần chèn (vị trí gợi ý, không tự tạo ảnh) theo đúng note (VD "3-5 ảnh").
- Rà lại nội dung có vi phạm chính sách chung không (không phải nội dung cờ bạc/cá độ/game bài nếu domain thuộc nhóm cấm các chủ đề này).

### Bước 4 — Rà tự nhiên hoá lần cuối
Đọc lại toàn bài với câu hỏi: "Nếu bỏ 2 anchor link đi, bài viết có vẫn là 1 bài đọc được, có giá trị thông tin không?" — nếu câu trả lời là "không, bài chỉ tồn tại để nhét link" thì viết lại phần nội dung xung quanh anchor cho có giá trị thông tin thực sự hơn.

### Bước 5 — Xuất bài viết hoàn chỉnh
Output gồm: `Tiêu đề bài | Nội dung đầy đủ (Markdown, có H2, có anchor dạng link) | Số từ thực tế | Danh sách vị trí ảnh đề xuất`.

## Lỗi thường gặp & cách xử lý
- **Anchor bị lặp lại nhiều lần trong bài** (chèn link cùng 1 anchor ở nhiều đoạn): chỉ chèn đúng 1 lần/anchor tại vị trí đã outline, các lần nhắc lại sau đó (nếu cần) dùng từ đồng nghĩa không gắn link.
- **Bài vượt quá giới hạn từ vì cố giải thích quá kỹ 1 H2**: cắt bớt ở H2 ít quan trọng hơn (thường là H2 mở đầu), giữ nguyên trọn vẹn H2 chứa anchor.
- **Domain yêu cầu bỏ phần thông tin liên hệ** (ghi trong Note, VD "bỏ phần thông tin liên hệ"): không thêm đoạn giới thiệu công ty/thông tin liên hệ ở cuối bài cho domain đó dù các bài khác có thể có.
- **Anchor text không khớp ngữ pháp tự nhiên trong câu** (anchor là cụm từ khoá SEO cứng): được phép biến đổi nhẹ hình thái từ (thêm/bớt từ nối) miễn giữ nguyên đúng anchor text gốc làm phần text hiển thị của link — không đổi hẳn sang từ đồng nghĩa khác vì sẽ sai anchor text đã được PM/kỹ thuật chốt.

## Tiêu chí chất lượng tự kiểm
- [ ] Mỗi anchor xuất hiện đúng 1 lần dưới dạng link, đúng vị trí đã outline.
- [ ] Số từ nằm trong giới hạn của domain (không vượt quá 10%).
- [ ] Bài đọc tự nhiên, có giá trị thông tin độc lập với việc chứa link (qua được câu hỏi ở Bước 4).
- [ ] Tuân thủ đúng ràng buộc riêng của domain (link trần, thông tin liên hệ, chủ đề cấm...).
- [ ] Anchor text hiển thị đúng nguyên văn (hoặc biến thể ngữ pháp nhẹ) so với anchor đã được chốt, không tự đổi sang từ khoá khác.
