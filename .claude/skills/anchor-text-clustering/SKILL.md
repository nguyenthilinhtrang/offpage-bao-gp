---
name: anchor-text-clustering
description: Ghép các anchor text đã được đề xuất (từ skill top-rank-backlink-analysis) thành từng cụm 2 anchor/bài, sao cho 2 anchor text đi cùng 1 bài báo/guest post có thể lồng ghép tự nhiên vào cùng một ngữ cảnh nội dung. Dùng sau khi đã có danh sách anchor text ưu tiên và trước khi giao cho PM chọn domain để đi bài.
license: Internal use only
allowed-tools: Read
metadata:
  category: seo-offpage
  author: agent-seo-offpage-technical
---

# Ghép anchor text phù hợp cùng 1 bài

## Mục đích
Một bài báo/guest post thường chèn được 2 anchor text/link. Cần chọn ra cặp anchor text nào có thể xuất hiện tự nhiên trong cùng 1 ngữ cảnh nội dung, tránh ghép các chủ đề không liên quan khiến bài viết bị gượng ép, không tự nhiên (Google/biên tập viên dễ nhận ra bài "nhồi" anchor).

## Input yêu cầu
- Danh sách anchor text đã đề xuất (output của skill `top-rank-backlink-analysis`): `Anchor text | URL | TOP hiện tại | Lí do đề xuất`.
- (Tuỳ chọn) Ngành/lĩnh vực của từng URL nếu người dùng đã biết trước, để rút ngắn bước phân loại.

## Quy trình chi tiết từng bước

### Bước 1 — Gắn nhãn chủ đề (topic tag) cho từng anchor text
Với mỗi anchor text, xác định:
- **Ngành lớn** (VD: nông nghiệp, sức khoẻ, công nghệ, giáo dục, xe cộ, tài chính...)
- **Đối tượng/ngữ cảnh cụ thể** trong ngành đó (VD trong nông nghiệp: "cây có múi" vs "cây công nghiệp" vs "cây ăn quả" — đây là các đối tượng KHÁC NHAU dù cùng ngành lớn "nông nghiệp").

Không dừng ở ngành lớn — 2 anchor cùng ngành lớn nhưng khác đối tượng/ngữ cảnh cụ thể vẫn có thể không ghép được (xem ví dụ ở Bước 2).

### Bước 2 — Kiểm tra điều kiện ghép được
**Điều kiện bắt buộc (loại ngay nếu vi phạm, kiểm tra TRƯỚC mọi điều kiện khác):** 2 anchor text trong cùng 1 bài phải trỏ tới **2 URL đích khác nhau**. Một bài không thể chèn 2 link dofollow cùng trỏ về 1 URL — hầu hết domain báo/GP chỉ cho phép "2 link do" nghĩa là 2 link tới 2 trang đích khác nhau, không phải 2 anchor khác nhau cùng trỏ 1 trang. Nếu 2 anchor tốt nhất của cùng 1 nhóm từ khoá đều trỏ về cùng 1 URL (rất hay gặp vì nhiều biến thể từ khoá cùng target 1 trang), KHÔNG được ghép 2 anchor đó với nhau — phải tách mỗi anchor sang 1 bài riêng, mỗi bài ghép với 1 anchor khác có URL khác (xem Bước 3, mục "xử lý cụm nhiều anchor cùng URL").

Sau khi đã xác nhận khác URL, mới xét tiếp 2 anchor text A và B ghép được vào cùng 1 bài khi thoả ít nhất 1 trong các điều kiện:
- Cùng đối tượng/ngữ cảnh cụ thể (VD: "xì mủ cây có múi" + "vàng lá thối rễ cam" — cùng nói về bệnh trên cây có múi).
- Khác đối tượng cụ thể nhưng có thể gộp trong 1 bài dạng tổng hợp/so sánh tự nhiên (VD: "cách chăm sóc cây cảnh trong nhà" + "cách chăm sóc cây cảnh ngoài trời" — vẫn tự nhiên trong 1 bài "hướng dẫn chăm sóc cây cảnh").

2 anchor KHÔNG ghép được khi:
- Khác đối tượng cụ thể và việc gộp sẽ tạo ngữ cảnh vô lý. Ví dụ mẫu: "xì mủ" (bệnh trên cây có múi) và "thuốc trị thán thư cà phê" (cây công nghiệp) — không ghép vì bài viết về bệnh cây có múi mà chèn thêm nội dung về cà phê là lạc chủ đề, người đọc/biên tập viên sẽ thấy gượng ép.
- Đối tượng đọc mục tiêu khác hẳn nhau (VD: 1 anchor hướng tới B2B doanh nghiệp, 1 anchor hướng tới người tiêu dùng cá nhân).

Tham khảo thêm bảng ví dụ ghép được/không ghép được tại `references/quy-tac-ghep-nganh.md` khi gặp case chưa chắc chắn (chỉ đọc khi cần, không load mặc định).

### Bước 3 — Ghép cặp (clustering)
1. Trước tiên, gom các anchor theo URL đích: mỗi URL là 1 "nhóm URL". Nếu 1 nhóm URL có nhiều hơn 1 anchor (rất phổ biến — nhiều biến thể từ khoá cùng trỏ 1 trang), các anchor trong CÙNG nhóm URL đó không bao giờ được ghép chung 1 bài với nhau (vi phạm điều kiện bắt buộc ở Bước 2) — mỗi anchor trong nhóm phải "xuất khẩu" sang ghép với 1 anchor thuộc URL khác, mỗi anchor có thể nằm ở 1 bài riêng biệt.
2. Nhóm các anchor (đã tách theo URL ở bước 1) theo đối tượng/ngữ cảnh cụ thể (nhóm chặt theo chủ đề).
3. Ghép cặp 2 anchor/bài giữa các URL khác nhau nhưng cùng đối tượng/ngữ cảnh. Nếu 1 URL có nhiều anchor, dùng mỗi anchor của URL đó ghép với 1 anchor khác URL trong CÁC bài khác nhau (không dùng 2 anchor cùng URL đó lại ghép chung 1 bài khác).
4. Với các anchor lẻ hoặc thuộc nhóm chỉ có 1 anchor, thử ghép sang nhóm liền kề theo điều kiện "gộp trong bài tổng hợp" ở Bước 2 — vẫn phải đảm bảo khác URL. Nếu không tìm được cặp phù hợp, để anchor đó đi riêng 1 bài (1 anchor/bài) — KHÔNG ép ghép miễn cưỡng và KHÔNG bao giờ ép ghép 2 anchor cùng URL chỉ vì thiếu đối tác.

**Xử lý cụm nhiều anchor cùng URL (case hay gặp):** nếu 1 URL "mạnh" có 3-4 anchor tốt (VD nhiều biến thể tên sản phẩm cùng trỏ 1 trang), coi URL đó như 1 nguồn cung cấp anchor dùng cho NHIỀU bài khác nhau — mỗi bài lấy đúng 1 anchor từ nguồn này, ghép với 1 anchor từ 1 URL khác biệt cho mỗi bài. Ưu tiên chọn URL đối tác đa dạng (không lặp lại cùng 1 URL đối tác cho tất cả các bài) để tránh cảnh báo trùng lặp.

### Bước 4 — Xuất kết quả
Output dạng bảng, mỗi dòng là 1 bài dự kiến, LUÔN tách riêng cột URL cho từng anchor (không gộp chung 1 cột "URL" — mỗi anchor có URL đích riêng và bắt buộc phải khác nhau):

| Nhóm bài | Anchor text 1 | URL đích 1 | Anchor text 2 | URL đích 2 | Chủ đề chung của bài | Lý do ghép (hoặc lý do đi riêng) |
|---|---|---|---|---|---|---|
| Bài 1 | xì mủ cây có múi | domain.vn/xi-mu-cay-co-mui | vàng lá thối rễ cam | domain.vn/vang-la-thoi-re | Bệnh hại trên cây có múi | Cùng đối tượng cụ thể: cây có múi, 2 URL khác nhau |
| Bài 2 | thuốc trị thán thư cà phê | domain.vn/than-thu-ca-phe | (đi riêng) | — | Bệnh trên cây công nghiệp | Không tìm được anchor cùng nhóm cây công nghiệp/khác URL để ghép, giữ nguyên 1 anchor/bài để tránh lạc chủ đề |

Trước khi xuất, rà lại toàn bộ bảng: nếu bất kỳ dòng nào có "URL đích 1" = "URL đích 2", đây là lỗi vi phạm điều kiện bắt buộc ở Bước 2 — phải sửa lại bằng cách tách/hoán đổi theo hướng dẫn ở Bước 3 trước khi báo cáo kết quả.

## Lỗi thường gặp & cách xử lý
- **Ghép quá tay theo ngành lớn**: 2 anchor cùng ngành lớn (VD cùng "nông nghiệp") nhưng khác cây trồng/đối tượng — mặc định KHÔNG ghép trừ khi qua được điều kiện "bài tổng hợp" ở Bước 2.
- **Số anchor lẻ**: không cố ép ghép cặp cuối cùng nếu không phù hợp ngữ cảnh — thà để 1 anchor/bài còn hơn tạo bài viết lạc đề.
- **Anchor thuộc nhiều đối tượng cùng lúc** (VD từ khoá vừa liên quan sức khoẻ vừa liên quan làm đẹp): chọn đối tượng gần với intent tìm kiếm chính của từ khoá đó, dựa vào URL đích đang nhắm.

## Tiêu chí chất lượng tự kiểm
- [ ] **Không có dòng nào có URL đích 1 = URL đích 2** — kiểm tra từng dòng, đây là điều kiện bắt buộc quan trọng nhất, vi phạm 1 dòng cũng phải sửa lại trước khi báo cáo.
- [ ] Mỗi cặp anchor trong output đều có "Chủ đề chung của bài" cụ thể (không viết chung chung kiểu "liên quan nhau").
- [ ] Không có cặp nào vi phạm ví dụ mẫu ở Bước 2 (khác đối tượng cụ thể, ghép gượng ép).
- [ ] Anchor đi riêng (không ghép) đều có lý do rõ ràng vì sao không tìm được cặp phù hợp.
- [ ] Tổng số anchor trong output = tổng số anchor input (không bị rơi/sót anchor nào).
