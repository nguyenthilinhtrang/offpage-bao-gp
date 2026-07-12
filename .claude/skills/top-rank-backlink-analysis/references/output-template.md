# Mẫu output đầy đủ — top-rank-backlink-analysis

Chỉ đọc file này khi cần đối chiếu format chi tiết hoặc xem ví dụ edge-case. Không cần load mặc định khi chạy skill.

## 1. Bảng thống kê theo BTK

| BTK | Tổng số từ | TOP 1-3 | TOP 1-5 | TOP 1-10 | TOP 10-20 | TOP 20-30 | Out TOP 30 |
|---|---|---|---|---|---|---|---|
| Bệnh cây có múi | 42 | 5 | 9 | 14 | 11 | 8 | 9 |
| Bệnh cây công nghiệp | 30 | 2 | 4 | 7 | 9 | 6 | 8 |

## 2. Bảng đề xuất anchor text (output chính)

| Anchor text | URL tương ứng | TOP hiện tại | Lí do đề xuất |
|---|---|---|---|
| xì mủ cây có múi | domain.vn/xi-mu-cay-co-mui | TOP 14 | TOP 10-20 (Bước 3); URL đã có 65% từ khoá TOP 10, các từ còn lại đều trong khoảng 10-30 (Bước 4, quy tắc ưu tiên) |
| cách trị vàng lá thối rễ cam | domain.vn/vang-la-thoi-re | TOP 17 | TOP 10-20 (Bước 3) |

## 3. Danh sách loại bỏ (tham khảo, không bắt buộc xuất ra trừ khi user hỏi)

| Từ khoá / URL | Lý do loại |
|---|---|
| thuốc trị rệp sáp cây kiểng | Out TOP 30, offpage không tác động (Bước 3) |
| domain.vn/trang-gioi-thieu | Không có từ khoá nào TOP 10, toàn bộ out TOP 20 (Bước 4, quy tắc loại bỏ) |

## Edge case: cannibalization
Nếu 2 URL cùng lên TOP cho 1 từ khoá (VD cả `/a` và `/b` đều rank cho "xì mủ cây có múi"), chỉ đề xuất anchor cho URL có TOP tốt hơn hoặc %keyword_in_top10 cao hơn, và ghi chú trong "Lí do đề xuất": `"Đã loại URL trùng cannibalization: domain.vn/b (TOP 22)"`.
