---
name: top-rank-backlink-analysis
description: Phân tích file check TOP (thứ hạng từ khoá) hiện tại của một dự án SEO để tổng hợp phân bố thứ hạng theo bộ từ khoá (BTK) và theo URL, từ đó đề xuất danh sách anchor text nên ưu tiên đi Offpage (báo/guest post). Dùng khi có file check TOP mới cần bóc tách, hoặc khi cần trả lời câu hỏi "nên đi offpage cho từ nào, URL nào".
license: Internal use only
allowed-tools: Read, Grep, Bash
metadata:
  category: seo-offpage
  author: agent-seo-offpage-technical
---

# Phân tích TOP hiện tại & đề xuất anchor text

## Mục đích
Từ 1 file check TOP (export từ tool rank-tracking như Ahrefs/SEMrush/Serprobot/SheetTOP nội bộ), xác định nhóm từ khoá và URL nào nên đầu tư Offpage, nhóm nào nên bỏ, và xuất ra danh sách anchor text đề xuất kèm lý do.

## Input yêu cầu
- 1 file check TOP (CSV/Excel/Google Sheet) chứa tối thiểu 3 cột dữ liệu, tên cột có thể khác nhau giữa các dự án — cần tự nhận diện theo các alias sau:
  - **Bộ từ khoá (BTK)**: "BTK", "Bộ từ khoá", "Nhóm từ khoá", "Category"
  - **Từ khoá**: "Từ khoá", "Keyword", "Anchor"
  - **URL**: "URL", "Link", "Trang đích"
  - **Thứ hạng hiện tại**: "TOP", "Vị trí", "Position", "Rank" (số nguyên; out top thường ghi là "-", ">100", "N/A" — coi là out TOP 30)
- Nếu không tìm thấy cột nào khớp alias, liệt kê hết tên cột thực tế trong file và hỏi lại người dùng cột nào tương ứng — không tự đoán khi mơ hồ.

## Quy trình chi tiết từng bước

### Bước 1 — Đọc & chuẩn hoá dữ liệu
1. Đọc toàn bộ file check TOP.
2. Chuẩn hoá cột TOP về số nguyên; giá trị rỗng/"-"/">30" → gán `out_top_30 = true`.
3. Gom nhóm theo BTK (nếu không có cột BTK, coi cả file là 1 BTK duy nhất).

### Bước 2 — Thống kê theo BTK
Với mỗi BTK, đếm số từ khoá rơi vào từng khoảng:
- TOP 1-3
- TOP 4-5 (để cộng dồn ra TOP 1-5)
- TOP 6-10 (để cộng dồn ra TOP 1-10)
- TOP 10-20
- TOP 20-30
- Out TOP 30

Xuất bảng tổng quan: `BTK | Tổng số từ | TOP 1-3 | TOP 1-5 | TOP 1-10 | TOP 10-20 | TOP 20-30 | Out TOP 30`.

### Bước 3 — Lọc từ khoá theo quy tắc ưu tiên
- **Ưu tiên đề xuất**: từ khoá đang ở TOP 10-20 (gần vào top 10, offpage có tác động rõ rệt để đẩy nốt).
- **Cân nhắc thêm**: từ khoá TOP 20-30 nếu URL chứa từ đó có nhiều từ khoá khác đã TOP 10 (xem Bước 4).
- **Loại bỏ**: từ khoá out TOP 30 — offpage gần như không tác động ở khoảng cách xa TOP như vậy.
- Từ khoá đã TOP 1-10 mặc định KHÔNG đề xuất trừ khi người dùng có mục tiêu giữ hạng/đẩy lên TOP 1-3 (hỏi rõ nếu không chắc).

### Bước 4 — Phân tích theo URL
Gom từ khoá theo URL đích, với mỗi URL tính:
- `%keyword_in_top10` = số từ khoá TOP 1-10 / tổng số từ khoá trỏ về URL đó.
- Áp dụng 2 quy tắc:
  1. **Ưu tiên xem xét**: URL có `%keyword_in_top10 > 50%` NHƯNG các từ khoá còn lại (chưa vào TOP 10) đang nằm trong khoảng TOP 10-30 → đây là URL "gần thắng", offpage cho các từ còn lại rất đáng đầu tư.
  2. **Loại bỏ khỏi phạm vi nhắm tới**: URL không có từ khoá nào vào TOP 10, và toàn bộ từ khoá của URL đó đang out TOP 20 → URL này chưa đủ nền tảng onpage/content để offpage phát huy tác dụng, không đưa vào danh sách đề xuất.

### Bước 5 — Tổng hợp danh sách đề xuất
Với các từ khoá còn lại sau Bước 3 và Bước 4, tạo bảng output theo đúng format:

| Anchor text | URL tương ứng | TOP hiện tại | Lí do đề xuất |
|---|---|---|---|
| ví dụ: xì mủ cây có múi | domain.vn/xi-mu-cay-co-mui | TOP 14 | Nằm trong TOP 10-20, URL đã có 60% từ khoá khác vào TOP 10 |

Mỗi dòng "Lí do đề xuất" phải nêu rõ đang áp dụng quy tắc nào ở Bước 3/Bước 4 (không viết chung chung).

Xem thêm mẫu output đầy đủ tại `references/output-template.md` (chỉ đọc file này khi cần đối chiếu format chi tiết hoặc ví dụ edge-case, không cần load mặc định).

## Lỗi thường gặp & cách xử lý
- **File có nhiều sheet/nhiều BTK trộn lẫn trong 1 sheet**: tách theo cột BTK trước khi thống kê, không gộp nhầm.
- **Trùng URL nhưng khác domain con (http vs https, có/không www)**: chuẩn hoá URL (bỏ protocol, trailing slash) trước khi gom nhóm ở Bước 4.
- **Từ khoá bị trùng lặp giữa nhiều URL** (2 URL cùng target 1 từ khoá — cannibalization): gắn cảnh báo riêng trong lý do đề xuất, ưu tiên chỉ đề xuất 1 URL mạnh hơn.
- **Thiếu cột TOP cho một số dòng**: loại các dòng đó ra khỏi thống kê và liệt kê riêng là "chưa có dữ liệu TOP", không tính vào out TOP 30.

## Tiêu chí chất lượng tự kiểm
Trước khi trả kết quả, tự kiểm tra:
- [ ] Đã có bảng thống kê theo BTK (đủ 6 khoảng TOP) trước khi đưa ra danh sách đề xuất.
- [ ] Đã có bước phân tích theo URL (không bỏ qua Bước 4).
- [ ] Không có từ khoá out TOP 30 nào lọt vào danh sách đề xuất.
- [ ] Không có URL "không bắt được từ nào TOP 10 và toàn bộ out TOP 20" nào lọt vào danh sách đề xuất.
- [ ] Mỗi dòng trong bảng output có lý do cụ thể, truy được về đúng quy tắc đã áp dụng.
