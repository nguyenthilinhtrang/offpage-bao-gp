# Web app — Lập kế hoạch SEO Offpage

Trang web tĩnh (không backend), người khác mở lên tự nhập input (file check TOP + ngân sách) và nhận output giống quy trình 2 agent `seo-offpage-technical` → `offpage-pm` trong repo này, nhưng chạy trực tiếp trong trình duyệt bằng API key Anthropic của chính họ.

## Kiến trúc

- **Không có server/backend** — 100% HTML/CSS/JS tĩnh, deploy qua GitHub Pages.
- **Bring-your-own-key** — người dùng tự nhập Anthropic API key, lưu trong `localStorage` của trình duyệt họ, gọi thẳng tới `api.anthropic.com` qua header `anthropic-dangerous-direct-browser-access: true` (cơ chế CORS chính thức của Anthropic cho browser). Key không đi qua server nào của mình.
- **Bảng giá sống** — fetch trực tiếp CSV từ 2 Google Sheet giá báo/GP (public, hỗ trợ CORS qua endpoint `gviz/tq?tqx=out:csv`) ngay trong bước 2, không cần copy dữ liệu tĩnh vào repo.
- **Tối ưu chi phí — chỉ gọi Claude cho phần thật sự cần ngữ nghĩa:**
  - Thống kê TOP theo BTK, tính `%keyword_in_top10` theo URL, lọc ứng viên (Bước 1-4 của skill `top-rank-backlink-analysis`) chạy **100% bằng JS thuần trong trình duyệt — không gọi API, không tốn token**, dù file check TOP dài hàng nghìn dòng (xem `computeStage1Local` trong `app.js`).
  - Việc nhận diện đúng cột nào là "Từ khoá"/"URL"/"TOP hiện tại" trong file CSV **vẫn cần 1 lệnh gọi Claude rất nhỏ mỗi BTK** (chỉ gửi header + vài dòng mẫu, không gửi cả file) — bắt buộc phải làm vậy vì tên cột tiếng Việt biến thiên quá nhiều giữa các dự án để hardcode an toàn: đã test thực tế và phát hiện cột "TOP lên AIO" (chỉ số AI Overview) dễ bị nhận nhầm thành cột TOP thật nếu dùng alias-matching thuần JS, dẫn tới kết quả sai hoàn toàn mà không báo lỗi.
  - Chỉ có **ghép cụm anchor theo chủ đề** (cần hiểu ngữ cảnh, VD "cùng đối tượng cụ thể") mới gửi lên Claude, và chỉ gửi danh sách ứng viên đã lọc sẵn (thường nhỏ hơn nhiều so với file gốc), không gửi nguyên file CSV thô.
  - Bước 2 (`offpage-pm`) áp dụng lọc bớt dòng chắc chắn bị loại (Note ghi "tạm dừng"/"dừng bán") bằng JS trước khi gửi bảng giá lên Claude — không đổi kết quả, chỉ giảm token.
- **2 bước gọi API chính** tương ứng đúng 2 agent:
  1. `seo-offpage-technical` — chỉ nhận danh sách ứng viên đã lọc (không phải file gốc), làm 2 việc: xét KPI-aware (nếu có file KPI) + ghép cụm anchor theo chủ đề, output ép theo JSON Schema (`output_config.format`).
  2. `offpage-pm` — system prompt rút gọn từ `.claude/skills/news-budget-selection` + `.claude/skills/guestpost-budget-selection`, input là output bước 1 + 2 bảng giá sống (đã lọc bớt) + ngân sách người dùng nhập.
- **Xuất Excel** client-side bằng SheetJS (CDN), không qua server.

## Chạy thử local

```sh
cd docs
python3 -m http.server 8934
# mở http://localhost:8934
```

## Giới hạn đã biết

- Sheet guest post ~1250 dòng vẫn được gửi gần như nguyên vẹn vào bước 2 (chỉ trừ các dòng Note "tạm dừng"/"dừng bán") để đúng nguyên tắc "đọc toàn bộ sheet trước khi kết luận" — đây là phần tốn token nhất còn lại, vì việc khớp danh mục ngành GP với lĩnh vực website khách là phán đoán ngữ nghĩa, không thể lọc an toàn bằng JS thuần. Hiển thị ước tính token trước khi gọi. Người dùng tự trả chi phí bằng API key của họ.
- Model mặc định là Claude Opus 5 (chất lượng cao nhất, cũng đắt nhất) — người dùng có thể đổi sang Sonnet 5/Haiku 4.5 ở mục 0 nếu muốn tiết kiệm.
- Hiện chỉ tương đương 2 agent đầu (`seo-offpage-technical`, `offpage-pm`); chưa có bước `offpage-content` (viết bài thật).
