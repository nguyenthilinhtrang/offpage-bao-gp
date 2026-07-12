---
name: guestpost-domain-filter
description: Lọc danh sách domain guest post (GP) phù hợp về lĩnh vực/ngành với 1 website, dựa trên bảng giá guest post sống trên Google Sheet của công ty (chia theo danh mục ngành như Công nghệ, Giáo dục, Xe cộ, Sức khoẻ...). Dùng khi cần chọn nơi đi guest post cho các anchor text/URL đã được kỹ thuật offpage đề xuất.
license: Internal use only
allowed-tools: Read
metadata:
  category: seo-offpage-pm
  author: agent-offpage-pm
  source-sheet: "https://docs.google.com/spreadsheets/d/1LYhURznnUbWq-8Ir_qpsC38RYlx3QIppC3MK2kDCRgs"
---

# Lọc domain guest post phù hợp

## Mục đích
Từ bảng giá guest post (Google Sheet dùng chung của team, tổ chức theo danh mục ngành), chọn ra tập domain GP đúng lĩnh vực với website khách hàng, để làm input cho skill `guestpost-budget-selection`.

## Nguồn dữ liệu
Google Sheet ID: `1LYhURznnUbWq-8Ir_qpsC38RYlx3QIppC3MK2kDCRgs`.
- Ưu tiên đọc trực tiếp qua Google Drive MCP tool (`read_file_content` với fileId trên) để lấy dữ liệu mới nhất — bảng có thể được cập nhật thêm domain/giá theo thời gian.
- Sheet được tổ chức thành nhiều khối theo danh mục ngành, mỗi khối có dòng tiêu đề danh mục (VD "CÔNG NGHỆ-THỦ THUẬT-TIN HỌC-GAME") rồi tới header cột: `STT | WEBSITE | DA | PA | DR | Organic Traffic | SỐ LINK | ĐƠN GIÁ | Note`.
- Danh mục đã ghi nhận tại thời điểm khảo sát (có thể sheet đã bổ sung thêm danh mục mới, luôn đọc hết toàn bộ sheet để không bỏ sót): Công nghệ - Thủ thuật - Tin học - Game, Giáo dục - Việc làm, Xe cộ, Sức khoẻ - Làm đẹp - Mẹ & bé. Xem chi tiết & lưu ý riêng từng danh mục tại `references/danh-muc-linh-vuc.md` (chỉ đọc khi cần).
- Quy tắc chung của cả hệ thống (đầu sheet): KHÔNG nhận web cờ bạc/cá độ/game bài/đổi thưởng; mảng coin/forex phụ phí +20%; thanh toán 1 lần trước khi đăng bài; traffic đo bằng Ahrefs.

## Quy trình chi tiết từng bước

### Bước 1 — Xác định lĩnh vực website khách hàng
Hỏi hoặc suy ra từ URL/nội dung website đang cần đi offpage thuộc danh mục nào trong sheet. Nếu website thuộc lĩnh vực chưa có danh mục tương ứng trong sheet (VD bất động sản, ẩm thực...), báo lại cho PM biết sheet hiện chưa có danh mục này thay vì tự chọn đại danh mục gần đúng.

### Bước 2 — Đọc dữ liệu sống & khoanh đúng khối danh mục
Đọc toàn bộ sheet, xác định đúng khối (block) domain thuộc danh mục khớp với Bước 1.

### Bước 3 — Áp dụng quy tắc loại trừ cứng
Loại ngay các domain thuộc lĩnh vực bị cấm chung (cờ bạc/cá độ/game bài/đổi thưởng theo quy tắc đầu sheet) — kể cả khi website khách không thuộc các lĩnh vực này, quy tắc này áp dụng để kiểm tra bản thân domain GP có match chính sách không.

### Bước 4 — Lọc theo Note riêng từng domain
Một số domain có giới hạn nội dung riêng trong cột Note (VD "Chỉ nhận topic liên quan tới game", "Ko dùng link trần") → chỉ giữ lại nếu website khách khớp giới hạn, và chuyển các ràng buộc kỹ thuật (không dùng link trần, textlink riêng...) cho bước chọn ngân sách/viết content.

### Bước 5 — Xuất danh sách đã lọc
Output bảng: `Website | Danh mục | DA | DR | Organic Traffic | Số link | Đơn giá | Note quan trọng`.

## Lỗi thường gặp & cách xử lý
- **1 website xuất hiện ở nhiều danh mục khác nhau trong sheet** (VD "Trangcongnghe.vn" và "Cunghocvui.com" xuất hiện cả ở khối Công nghệ lẫn khối Giáo dục/Xe cộ) → đây là chủ đích của bên bán (site đa chủ đề), có thể dùng cho nhiều lĩnh vực khách hàng khác nhau, không phải lỗi trùng dữ liệu cần loại bỏ.
- **Giá ghi dạng viết tắt** (VD "textlink 1tr3/tháng") → đây là loại hình khác (textlink theo tháng, không phải guest post 1 lần), không gộp chung vào bảng chọn GP trừ khi PM yêu cầu rõ.
- **Traffic ghi dạng rút gọn** (VD "18k", "1k2", "18k8") → quy đổi đúng: "18k" = 18.000, "1k2" = 1.200, "18k8" = 18.800.
- **Cột DA/PA/DR để trống** → không loại domain chỉ vì thiếu số liệu, nhưng ưu tiên thấp hơn domain có đủ số liệu khi giá tương đương.

## Tiêu chí chất lượng tự kiểm
- [ ] Đã xác định đúng lĩnh vực website trước khi lọc, không lọc lan man cả sheet.
- [ ] Không có domain thuộc danh mục bị cấm (cờ bạc, cá độ...) lọt vào output.
- [ ] Mọi domain có Note giới hạn topic đều được đối chiếu đúng với lĩnh vực khách hàng.
- [ ] Giá và traffic đã được quy đổi đúng đơn vị (VNĐ đầy đủ, không còn viết tắt "k"/"tr" gây nhầm khi tính ngân sách ở skill tiếp theo).
