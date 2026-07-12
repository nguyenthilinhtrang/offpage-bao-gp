---
name: news-domain-filter
description: Lọc danh sách domain báo (báo tỉnh/địa phương và báo thường) phù hợp để đăng bài PR cho 1 website, dựa trên bảng giá báo dofollow sống trên Google Sheet của công ty. Dùng khi cần chọn báo để đi bài cho các anchor text/URL đã được kỹ thuật offpage đề xuất.
license: Internal use only
allowed-tools: Read
metadata:
  category: seo-offpage-pm
  author: agent-offpage-pm
  source-sheet: "https://docs.google.com/spreadsheets/d/19Mj7CKc26bzewgh8W8nq5G8RwD2nV4spcBIMHicLr5Q"
---

# Lọc domain báo phù hợp

## Mục đích
Từ bảng giá báo PR dofollow (Google Sheet dùng chung của team), chọn ra tập domain báo phù hợp về ngân sách, chủ đề (nếu báo có giới hạn topic) và tình trạng nhận bài, để làm input cho skill `news-budget-selection`.

## Nguồn dữ liệu
Google Sheet ID: `19Mj7CKc26bzewgh8W8nq5G8RwD2nV4spcBIMHicLr5Q` (gid `1705456031`).
- Ưu tiên đọc trực tiếp qua Google Drive MCP tool (`read_file_content` với fileId trên) để có dữ liệu mới nhất — KHÔNG dùng dữ liệu cũ đã cache trong bộ nhớ hội thoại vì bảng giá được cập nhật thường xuyên.
- Nếu không có quyền truy cập MCP Google Drive, fallback bằng cách mở link export CSV: thay `/edit...` bằng `/export?format=csv&gid=<gid>`.

Cấu trúc sheet gồm 2 khối chính (không có cột "lĩnh vực" — báo nhận đa số chủ đề trừ khi cột Note ghi giới hạn):
- **Khối "Báo tỉnh/địa phương"**: cột `STT | Tên báo | DR | Traffic | Link Do | Giá | Note | Demo`.
- **Khối "Báo thường"**: cột `STT | Tên báo | DR | Traffic | Link Do | Giá đại lý | Note`.

Xem cấu trúc dữ liệu mẫu & cách đọc cột Note tại `references/danh-sach-bao.md` (chỉ đọc khi cần đối chiếu, không load mặc định).

## Quy trình chi tiết từng bước

### Bước 1 — Đọc dữ liệu sống
Đọc toàn bộ 2 khối từ Google Sheet, giữ nguyên STT, tên báo, DR, Traffic, Giá, Note.

### Bước 2 — Loại các báo không dùng được
Loại khỏi danh sách các báo có Note chứa các tín hiệu:
- "Tạm dừng nhận" / "Dừng bán" / "Tạm dừng" → loại hẳn.
- Yêu cầu điều kiện đặc biệt mà website khách không đáp ứng được (VD "Cần GPKD" — cần hỏi lại PM/khách hàng có giấy phép kinh doanh không nếu chưa rõ).
- Giới hạn chủ đề rõ ràng không khớp với ngành của website (VD ghi "chỉ nhận topic X") → loại nếu website không thuộc ngành X.

### Bước 3 — Đối chiếu ngành/chủ đề website
Đa số báo thường/báo tỉnh KHÔNG giới hạn chủ đề (nhận PR đa ngành), nên bước lọc chính là Bước 2. Chỉ cần xác nhận thêm:
- Website thuộc ngành nhạy cảm (y tế, tài chính, thực phẩm chức năng...) → ưu tiên báo có DR/độ uy tín cao hơn, tránh báo quá thấp DR vì dễ bị soi nội dung.

### Bước 4 — Xếp hạng theo hiệu quả/chi phí
Tính `hiệu quả = DR / Giá` (đơn vị: điểm DR trên mỗi 1 triệu đồng) để tham khảo, nhưng KHÔNG chọn thay — chỉ xếp hạng tương đối, việc chọn số lượng cụ thể theo ngân sách do skill `news-budget-selection` đảm nhiệm.

### Bước 5 — Xuất danh sách đã lọc
Output bảng: `Tên báo | Loại (tỉnh/thường) | DR | Traffic | Giá | Note quan trọng | Ghi chú phù hợp`.

## Lỗi thường gặp & cách xử lý
- **Dữ liệu Giá bị format số kiểu Việt Nam** (dấu chấm ngăn cách hàng nghìn, VD "1.200.000") → parse đúng thành 1200000, không nhầm dấu chấm là dấu thập phân.
- **DR/Traffic để trống** (nhiều dòng không có số liệu) → không loại báo chỉ vì thiếu DR, nhưng đánh dấu "chưa có dữ liệu DR" để PM tự cân nhắc, ưu tiên thấp hơn báo có đủ số liệu khi 2 báo giá tương đương.
- **STT bị trùng/nhảy số trong sheet gốc** → không dùng STT để định danh, dùng tên domain (cột "Tên báo") làm khoá chính.
- **Sheet có thể có thêm khối mới ngoài 2 khối đã biết** (báo bổ sung theo thời gian) → luôn đọc hết toàn bộ sheet, không giả định chỉ có 2 khối cố định.

## Tiêu chí chất lượng tự kiểm
- [ ] Đã đọc dữ liệu sống từ Google Sheet, không dùng số liệu cũ từ lần chạy trước.
- [ ] Không còn báo nào ghi "tạm dừng/dừng bán" trong danh sách đầu ra.
- [ ] Giá tiền đã parse đúng (không lệch hàng nghìn/hàng triệu).
- [ ] Mỗi báo trong output đều có ghi chú vì sao phù hợp hoặc cảnh báo (nếu có).
