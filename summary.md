# Summary — Trạng thái dự án

> Đọc file này **trước** khi bắt đầu bất kỳ phiên làm việc nào trong workspace này. Xem [CLAUDE.md](CLAUDE.md) để biết quy tắc làm việc + quy ước kiến trúc.

Cập nhật lần cuối: 2026-07-13

## Trạng thái hiện tại

**Đã xong — 3 agent + 8 skill** ở `.claude/agents/` và `.claude/skills/`, đầy đủ frontmatter, quy trình từng bước, xử lý lỗi thường gặp, tiêu chí tự kiểm chất lượng.

**Đã chạy thử end-to-end thật — dự án Hợp Trí (hoptrisummit.com):**
- Input: file check TOP thật (2 BTK: "Thương Hiệu" 74 từ khoá, "Thông tin" 370 từ khoá) + bảng KPI T8/2026.
- `seo-offpage-technical` phân tích TOP, đề xuất anchor, ghép 15 cụm (30 anchor, không trùng URL trong cùng 1 bài, đã gắn nhãn Mạnh/Mạnh-khá/Bridge).
- `offpage-pm` lọc domain báo (Google Sheet giá báo) + GP (Google Sheet giá GP, dùng nhóm "Tin tổng hợp" vì sheet không có danh mục nông nghiệp đúng nghĩa), chọn 5 báo + 10 GP đúng ngân sách.
- Output tách theo giai đoạn (từ 2026-07-30, xem quy ước ở CLAUDE.md):
  - `outputs/hoptri/HopTri-AnchorText-2026-07-13.xlsx` — output `seo-offpage-technical`: thống kê TOP & KPI, 15 cụm anchor đã ghép, dự phòng.
  - `outputs/hoptri/HopTri-ChonDomain-2026-07-13.xlsx` — output `offpage-pm` (deliverable cuối, trước đây tên `Hop-Tri-Ke-hoach-Offpage.xlsx`): 5 báo + 10 GP kèm anchor/URL/mức ghép, tổng ngân sách 13.200.000đ (báo 5.5tr + GP 7.7tr), toàn bộ link dofollow.
- `offpage-content` **chưa chạy thật** — chưa có yêu cầu viết content thật cho 15 bài này.

**Đã sửa 2 lỗi phát hiện được trong lúc chạy thử (đã cập nhật vào SKILL.md để không lặp lại):**
1. `offpage-pm` tự mâu thuẫn tiêu chí (nói ưu tiên dofollow nhưng chọn nhầm 4 domain nofollow) — đã phát hiện qua kiểm tra chéo, sửa thủ công, ghi vào CLAUDE.md nguyên tắc "luôn verify output sub-agent".
2. `anchor-text-clustering` ghép 9/15 cặp anchor cùng trỏ 1 URL (vi phạm ràng buộc thực tế "1 bài không thể 2 link cùng đích") — đã bổ sung điều kiện bắt buộc + bước rà soát cuối vào `SKILL.md`, và case "URL cô lập" vào `references/quy-tac-ghep-nganh.md`.

## Quyết định đã chốt (không cần hỏi lại)

- Xem đầy đủ ở [CLAUDE.md](CLAUDE.md) mục "Quy ước dữ liệu".
- Repo GitHub: public, tên `offpage-bao-gp` — https://github.com/nguyenthilinhtrang/offpage-bao-gp (đã xác nhận với user chấp nhận public dù `data/` chứa số điện thoại vendor + tên khách hàng thật).

## Bằng chứng vận hành (thêm ngày 2026-07-30, sau deadline 28/07)

- **Lịch sử trò chuyện BTVN buổi 4**: `exports/hoptri-offpage-2026-07-12.md` — export từ session Claude Code gốc ngày 12-13/07 (lúc build agent/skill + chạy thử dự án Hợp Trí). File này được thêm vào repo ngày 30/07, tức **sau** deadline nộp bài (28/07 23h59) — ghi chú rõ ở đây để minh bạch, tránh hiểu nhầm là làm sát nút.
- **Demo chạy thật** (`exports/demo-seo-offpage-technical.cast` + `.gif`, ghi ngày 30/07 bằng `asciinema`+`agg`): terminal recording gọi `claude --agent seo-offpage-technical` phân tích trực tiếp `data/hoptri/btk1-thuong-hieu-checktop.csv` (74 từ khoá) bằng skill `top-rank-backlink-analysis` — output thật, không dàn dựng trước (agent tự tính lại % TOP, tự phát hiện KPI lệch ngày snapshot, tự đề xuất 4 anchor + cảnh báo "URL cô lập" cần ghép chéo BTK khác).
- **Cấu trúc lại `outputs/` theo dự án** (30/07): mỗi dự án 1 folder (`outputs/hoptri/`, `outputs/sunlife/`), tách file theo giai đoạn agent thay vì 1 file gộp — xem quy ước ở CLAUDE.md. `Sunlife-Ke-hoach-Offpage.xlsx` đổi tên thành `outputs/sunlife/Sunlife-ChonDomain-2026-07-13.xlsx` (chưa có file `Sunlife-AnchorText-*` vì không tìm lại được bảng cụm anchor gốc của dự án này trong lịch sử session — cần chạy lại `seo-offpage-technical` nếu muốn có file này). Xoá `outputs/Rackcosmo/` — đây là folder rỗng còn sót lại từ 1 phiên chat khác (so sánh nội dung 2 website đối thủ), không phải deliverable của quy trình offpage nên không thuộc `outputs/`.

## Việc còn dang dở / chưa làm

- **Nâng cấp skill sang code Python có test** (tham khảo cấu trúc `scripts/` + `tests/` + `state/` của workspace `seo-workspace` — xem repo tham khảo https://github.com/minhdo01011990-glitch/seo-workspace) — hiện 8 skill của workspace này đều ở dạng hướng dẫn markdown thuần (Claude tự làm thủ công theo bước), chưa có script/test riêng. Việc này sẽ giúp các phần tính toán (chọn domain theo ngân sách, kiểm tra khác-URL...) chắc chắn đúng 100% thay vì dựa vào model tự nhớ quy tắc mỗi lần chạy — nên làm ở buổi học sau, không phải việc gấp.
- `offpage-content` chưa được chạy thử thật với 1 bài viết hoàn chỉnh nào.
