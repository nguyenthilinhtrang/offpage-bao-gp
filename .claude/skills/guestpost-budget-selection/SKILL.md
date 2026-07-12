---
name: guestpost-budget-selection
description: Chọn z số lượng guest post từ danh sách domain GP đã lọc (output của skill guestpost-domain-filter) sao cho tổng ngân sách đi GP khớp với con số n đã định, ưu tiên phân bổ đa dạng DA/DR và đúng anchor text/URL cần đi. Dùng khi PM đã có danh sách domain GP phù hợp và cần chốt danh sách cuối cùng theo ngân sách.
license: Internal use only
allowed-tools: Read
metadata:
  category: seo-offpage-pm
  author: agent-offpage-pm
---

# Chọn số lượng guest post theo ngân sách

## Mục đích
Tương tự bài toán ở `news-budget-selection` nhưng áp dụng cho guest post: chọn z domain GP sao cho tổng chi phí xấp xỉ ngân sách n, với đặc thù riêng của GP là mức giá trung bình mục tiêu ~800.000đ/GP (khung phổ biến 500.000 – 1.000.000đ theo quy ước nội bộ team; domain giá cao hơn khung này chỉ chọn khi ngân sách n dư dả hoặc cần domain DR/DA đặc biệt cao).

## Input yêu cầu
- Danh sách GP đã lọc theo đúng lĩnh vực (output `guestpost-domain-filter`): `Website | Danh mục | DA | DR | Organic Traffic | Số link | Đơn giá | Note`.
- Danh sách anchor text/cụm anchor cần đi GP (phần được PM chỉ định "đi GP" từ output `anchor-text-clustering`).
- Số lượng GP cần chọn: **z**.
- Tổng ngân sách: **n** (VNĐ).

## Quy trình chi tiết từng bước

### Bước 1 — Kiểm tra tính khả thi
Tính `giá trung bình mục tiêu = n / z`. Đối chiếu với khung giá phổ biến 500.000 – 1.000.000đ:
- Nếu giá trung bình mục tiêu < 500.000đ: khó khả thi vì phần lớn domain chất lượng tối thiểu trong sheet đã ở mức 500.000đ trở lên — báo lại cho PM.
- Nếu giá trung bình mục tiêu vượt xa 1.000.000đ: khả thi nhưng nên tận dụng để chọn thêm domain DA/DR cao hơn khung phổ biến, không nhất thiết ép về đúng 800k/GP.

### Bước 2 — Sắp xếp theo hiệu quả trong đúng danh mục lĩnh vực
Trong tập domain đã lọc đúng lĩnh vực, sắp xếp theo `DR/Giá` (hoặc `DA/Giá` nếu domain thiếu DR) giảm dần.

### Bước 3 — Chọn greedy có kiểm soát tổng, neo quanh mức trung bình 800k
1. Chọn domain sao cho giá từng domain dao động quanh khung 500.000 – 1.000.000đ là chủ đạo, xen kẽ tối đa 1-2 domain giá cao hơn nếu ngân sách n cho phép và domain đó có DR vượt trội — không dồn hết ngân sách vào 1 domain đắt làm thiếu domain cho các anchor còn lại.
2. Chọn tới khi đủ z domain, tính `độ lệch = |tổng giá - n| / n`.
3. Nếu độ lệch > 10%: hoán đổi domain giá cao/thấp để đưa tổng về gần n, ưu tiên giữ domain đã đúng lĩnh vực sát nhất với website khách nếu phải đánh đổi DR.
4. Nếu không đưa được độ lệch xuống dưới 10%, báo cáo phương án gần nhất cho PM, không tự vượt ngân sách mà không cảnh báo.

### Bước 4 — Gán anchor text cho từng domain đã chọn
Gán 1 cặp anchor (ưu tiên các cặp đã ghép ở `anchor-text-clustering`) cho mỗi domain, đối chiếu lại Note của domain đó (VD "chỉ nhận topic liên quan tới X", "không dùng link trần") để đảm bảo anchor/URL gán vào không vi phạm điều kiện riêng.

### Bước 5 — Xuất kết quả
Output bảng: `Website | Đơn giá | Anchor text được gán | URL đích | DA/DR | Ghi chú đặc biệt (phụ phí coin/forex +20% nếu có, ràng buộc link trần...)`.
Kèm dòng tổng: `Tổng ngân sách thực tế: [tổng] / Ngân sách n: [n] / Độ lệch: [%] / Giá trung bình/GP: [tổng/z]`.

## Lỗi thường gặp & cách xử lý
- **Domain thuộc mảng coin/forex**: cộng thêm phụ phí +20% vào đơn giá trước khi tính tổng (quy tắc chung toàn hệ thống guest post).
- **z lớn hơn số domain khả dụng đúng lĩnh vực**: không lấy tạm domain sai lĩnh vực để đủ số — báo lại cho PM số lượng tối đa khả dụng và đề xuất mở rộng sang lĩnh vực liền kề nếu hợp lý.
- **Domain tính giá theo năm/theo tháng thay vì theo bài** (VD gói 1 năm, textlink theo tháng): tách riêng khỏi phép tính ngân sách theo bài, chỉ đưa vào nếu PM xác nhận muốn dùng mô hình đó.
- **Nhiều anchor hơn domain được chọn**: ưu tiên gán cho anchor có TOP tốt hơn/cấp thiết hơn theo lý do đề xuất gốc, phần dư báo cáo lại cho đợt sau.

## Tiêu chí chất lượng tự kiểm
- [ ] Đã kiểm tra tính khả thi (Bước 1) trước khi chọn.
- [ ] Đúng số lượng z domain được chọn (trừ khi đã báo cáo lý do không đủ).
- [ ] Giá trung bình/GP trong output gần với khung 500k-1tr (hoặc có lý do rõ ràng nếu lệch).
- [ ] Phụ phí coin/forex đã được cộng đúng nếu có domain thuộc mảng này.
- [ ] Mọi domain được gán anchor đều đã đối chiếu Note riêng, không vi phạm điều kiện đăng bài.
