# Workspace: Agent Offpage (SEO Offpage — kỹ thuật / PM / content)

> **Trước khi làm việc trong workspace này, đọc [summary.md](summary.md) trước** để biết trạng thái hiện tại, quyết định đã chốt, và việc còn dang dở. File này (CLAUDE.md) chỉ chứa quy tắc làm việc + quy ước kiến trúc, không phản ánh tiến độ.

## Bối cảnh dự án

Workspace này xây dựng 1 hệ thống 3 agent + 8 skill cho quy trình SEO Offpage (đi báo PR + guest post) của agency, dùng chung cho nhiều dự án khách hàng khác nhau.

## 3 agent ở `.claude/agents/`

- **`seo-offpage-technical`** — phân tích file check TOP (cột "Now") của dự án, đối chiếu KPI, đề xuất anchor text nên đi offpage và ghép các anchor thành từng cụm 2 anchor/bài. Dùng 2 skill: `top-rank-backlink-analysis`, `anchor-text-clustering`.
- **`offpage-pm`** — nhận danh sách cụm anchor từ agent kỹ thuật, lọc domain báo/GP phù hợp lĩnh vực + ngân sách, chốt danh sách domain cuối cùng. Dùng 4 skill: `news-domain-filter`, `guestpost-domain-filter`, `news-budget-selection`, `guestpost-budget-selection`.
- **`offpage-content`** — CHỈ dùng khi cần viết bài thật (không phải lúc nào cũng gọi). Lên outline rồi viết content chèn anchor tự nhiên. Dùng 2 skill: `offpage-content-outline`, `offpage-content-writing`.

**Thứ tự chạy chuẩn:** `seo-offpage-technical` → `offpage-pm` → (tuỳ chọn) `offpage-content`. Agent sau luôn cần output của agent trước làm input, không nhảy cóc.

## Quy ước dữ liệu — đã chốt, không cần hỏi lại

- **Bảng giá báo PR dofollow** (dùng chung mọi dự án): Google Sheet `19Mj7CKc26bzewgh8W8nq5G8RwD2nV4spcBIMHicLr5Q`, tab "Báo PR", gid `1705456031`. Cấu trúc 2 khối: "Báo tỉnh/địa phương" và "Báo thường". Cột giá hay ghi kiểu VN (`1.200.000`) — parse cẩn thận, không nhầm dấu chấm ngăn cách nghìn với thập phân.
- **Bảng giá guest post** (dùng chung mọi dự án): Google Sheet `1LYhURznnUbWq-8Ir_qpsC38RYlx3QIppC3MK2kDCRgs`, sheet "Trang tính1", ~1256 dòng chia theo danh mục ngành (Công nghệ, Giáo dục, Xe cộ, Sức khoẻ, Thời trang, F&B, Tài chính, BĐS, Môi trường-Nông nghiệp, **Tin tổng hợp (đa ngành)**...). Luôn đọc **toàn bộ** sheet trước khi kết luận "không có danh mục phù hợp" — sheet lớn hơn nhiều so với preview đầu tiên hay thấy. Danh mục "Tin tổng hợp" là phương án dự phòng tốt khi không có danh mục đúng ngành (site đa chủ đề, chấp nhận nhiều topic).
- **File check TOP của từng dự án khách hàng khác nhau** — không có ID cố định, luôn hỏi/nhận link từ user. Cột `Now` = TOP hiện tại (dùng cột này, không dùng các cột ngày lịch sử). Giá trị `-` = out TOP (không rank).
- **Ngân sách tham khảo:** báo ~1.000.000–1.500.000đ/bài, guest post trung bình ~800.000đ/bài (khung phổ biến 500.000–1.000.000đ). Luôn kiểm tra tính khả thi (giá trung bình mục tiêu = ngân sách/số lượng) trước khi chọn, báo lại nếu phi thực tế thay vì cố ép chọn đủ số.
- **Quy tắc ghép anchor bắt buộc:** 2 anchor text trong CÙNG 1 bài phải trỏ tới 2 URL đích KHÁC NHAU (1 bài không thể chèn 2 link dofollow cùng đích). Khi 1 URL có nhiều anchor tốt (nhiều biến thể từ khoá cùng target 1 trang — rất hay gặp), mỗi anchor phải tách sang bài khác nhau, ghép với anchor thuộc URL khác. Xem chi tiết case "URL cô lập" ở `.claude/skills/anchor-text-clustering/references/quy-tac-ghep-nganh.md`.
- **Mức độ hợp lý ngữ cảnh khi ghép anchor** — luôn gắn nhãn Mạnh / Mạnh-khá / Bridge cho từng cặp khi báo cáo (xem skill `anchor-text-clustering`), không trình bày các cặp như thể mạnh ngang nhau. Ưu tiên cặp Mạnh/Mạnh-khá cho Báo (chi phí cao, rủi ro thương hiệu cao hơn), để cặp Bridge (ghép miễn cưỡng vì hết lựa chọn) xuống GP.
- **KPI-aware:** không chỉ dựa vào khung TOP chung (ưu tiên TOP10-20) — nếu 1 BTK đã mạnh (VD 85% TOP1-3) nhưng KPI ở mốc gần hơn (TOP5) chưa đạt, vẫn cần ưu tiên offpage cho URL đó, kể cả khi ít ứng viên. Xem `data/hoptri/kpi-2-btk.csv` làm ví dụ.

## Quy ước folder & output

```
.claude/agents/*.md          # 3 agent, frontmatter chuẩn (name, description, tools, model)
.claude/skills/<ten-skill>/  # 8 skill, mỗi skill có SKILL.md + references/*.md (chỉ load khi cần)
data/<du-an>/                # dữ liệu trung gian đã export sẵn từ Google Sheet (CSV) cho 1 dự án cụ thể
data/domain-lists/           # danh sách báo/GP đã lọc sẵn (dùng chung, cập nhật lại khi chạy dự án mới)
outputs/<du-an>/              # deliverable cuối cùng, 1 folder riêng cho mỗi dự án khách hàng
```

**Quy ước output trong `outputs/<du-an>/` — tách theo giai đoạn agent, không gộp chung 1 file:**
- `<DuAn>-AnchorText-<ngay>.xlsx` — output giai đoạn `seo-offpage-technical` (thống kê TOP & KPI, bảng cụm anchor text đã ghép, danh sách dự phòng). Chưa có domain, dùng để bàn giao cho PM.
- `<DuAn>-ChonDomain-<ngay>.xlsx` — output giai đoạn `offpage-pm` (domain báo/GP đã chọn kèm anchor/URL tương ứng, ngân sách). Đây là deliverable cuối cùng giao khách hàng.
- `<ngay>` = ngày hoàn tất giai đoạn đó, định dạng `YYYY-MM-DD`. Ví dụ: `HopTri-AnchorText-2026-07-13.xlsx`, `HopTri-ChonDomain-2026-07-13.xlsx`.
- Không tạo folder/file output rỗng cho việc không thuộc quy trình offpage (VD so sánh đối thủ, phân tích 1 lần) — những việc đó không đi vào `outputs/`.

## Nguyên tắc làm việc

1. **Luôn đọc dữ liệu sống** từ Google Sheet (qua Google Drive MCP hoặc export CSV mới) trước khi lọc domain/giá — giá và tình trạng nhận bài thay đổi thường xuyên, không dùng số liệu nhớ từ lần chạy trước.
2. **Sub-agent thiếu tool thì export dữ liệu ra CSV cục bộ** cho nó đọc bằng `Read`, thay vì gán thêm quyền MCP tràn lan — giữ tool list của từng agent tối giản, đúng theo mô tả vai trò.
3. **Kiểm tra chéo output của sub-agent trước khi báo cáo cho user** — sub-agent có thể tự mâu thuẫn với tiêu chí nó vừa nêu (VD tự nói "ưu tiên dofollow" nhưng vẫn chọn domain nofollow). Không relay nguyên văn khi chưa verify.
