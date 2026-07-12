---
name: news-budget-selection
description: Chọn x số lượng báo từ danh sách báo đã lọc (output của skill news-domain-filter) sao cho tổng ngân sách đi báo khớp với con số y đã định, ưu tiên phân bổ đa dạng DR/traffic và đúng anchor text/URL cần đi. Dùng khi PM đã có danh sách báo phù hợp và cần chốt danh sách cuối cùng theo ngân sách.
license: Internal use only
allowed-tools: Read
metadata:
  category: seo-offpage-pm
  author: agent-offpage-pm
---

# Chọn số lượng báo theo ngân sách

## Mục đích
Đây là bài toán chọn tập con (subset selection, gần giống knapsack): từ danh sách báo đã lọc, chọn ra đúng x báo sao cho tổng chi phí xấp xỉ ngân sách y, đồng thời mỗi báo được gán đúng 1 (hoặc 1 cặp) anchor text/URL cần đi.

## Input yêu cầu
- Danh sách báo đã lọc (output `news-domain-filter`): `Tên báo | DR | Traffic | Giá | Note`.
- Danh sách anchor text/cụm anchor cần đi báo (output `anchor-text-clustering`, lọc riêng phần được PM chỉ định "đi báo" thay vì "đi GP").
- Số lượng báo cần chọn: **x**.
- Tổng ngân sách: **y** (VNĐ).
- Mức giá tham chiếu thị trường: báo thường dao động 1.000.000 – 2.000.000đ/bài (theo quy ước nội bộ team); có thể lệch nếu ngân sách yêu cầu khác.

## Quy trình chi tiết từng bước

### Bước 1 — Kiểm tra tính khả thi
Tính `giá trung bình mục tiêu = y / x`. Nếu giá trung bình mục tiêu nằm ngoài khoảng giá thực tế có trong danh sách đã lọc (thấp hơn báo rẻ nhất hoặc cao hơn báo đắt nhất) → báo lại ngay cho PM là **không khả thi với x và y hiện tại**, đề xuất điều chỉnh x hoặc y, KHÔNG cố ép chọn cho đủ số.

### Bước 2 — Sắp xếp theo hiệu quả
Sắp xếp danh sách theo `DR/Giá` giảm dần trong biên độ giá 1.000.000 – 2.000.000đ (ưu tiên đúng khung giá chuẩn của team), tách riêng các báo ngoài khung giá này để cân nhắc sau nếu cần.

### Bước 3 — Chọn greedy có kiểm soát tổng
1. Chọn lần lượt từ đầu danh sách đã sắp xếp cho tới khi đủ x báo, theo dõi tổng giá chạy.
2. Sau khi có đủ x báo, tính `độ lệch = |tổng giá - y| / y`.
3. Nếu độ lệch > 10%: thử hoán đổi 1-2 báo (đổi báo giá cao hơn/thấp hơn) để đưa tổng về gần y hơn, ưu tiên giữ báo có DR cao nếu phải đánh đổi.
4. Nếu sau vài lần hoán đổi vẫn không đưa được độ lệch xuống dưới 10%, báo lại thực tế cho PM kèm phương án gần nhất, không tự ý vượt ngân sách mà không cảnh báo.

### Bước 4 — Gán anchor text cho từng báo đã chọn
Với mỗi báo đã chọn, gán 1 anchor text (hoặc 1 cặp anchor đã ghép ở skill `anchor-text-clustering`) phù hợp — ưu tiên gán các cặp anchor đã ghép sẵn vào đúng 1 báo, không tách cặp ra 2 báo khác nhau trừ khi bắt buộc vì thiếu số báo.

### Bước 5 — Xuất kết quả
Output bảng: `Tên báo | Giá | Anchor text được gán | URL đích | DR | Ghi chú (VD: cần mua thêm link dofollow nếu Link Do = 0)`.
Kèm dòng tổng: `Tổng ngân sách thực tế: [tổng] / Ngân sách y: [y] / Độ lệch: [%]`.

## Lỗi thường gặp & cách xử lý
- **x quá lớn so với số báo có sẵn trong danh sách đã lọc**: báo lại số lượng tối đa khả dụng, không lặp lại 1 báo 2 lần để đủ số.
- **Có báo "Link Do = 0" lọt vào danh sách** (cần mua thêm link riêng theo Note): cộng thêm chi phí mua link vào tổng ngân sách của báo đó trước khi tính độ lệch ở Bước 3, không bỏ sót chi phí ẩn này.
- **Nhiều anchor hơn số báo được chọn**: ưu tiên gán anchor cho các URL có TOP tốt hơn/cấp thiết hơn (dựa theo lý do đề xuất từ skill `top-rank-backlink-analysis`), các anchor còn lại chuyển sang đợt tiếp theo hoặc báo cho PM cân nhắc tăng x.

## Tiêu chí chất lượng tự kiểm
- [ ] Đã kiểm tra tính khả thi (Bước 1) trước khi chọn, không chọn ép khi giá trung bình mục tiêu phi thực tế.
- [ ] Đúng số lượng x báo được chọn (trừ khi đã báo cáo rõ lý do không đủ).
- [ ] Độ lệch ngân sách đã được tính và hiển thị rõ trong output.
- [ ] Mọi chi phí ẩn (mua thêm link dofollow...) đã được cộng vào tổng trước khi báo cáo.
- [ ] Không có anchor nào bị gán trùng 2 báo khác nhau.
