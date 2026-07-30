# Web app — Lập kế hoạch SEO Offpage

Trang web tĩnh (không backend), người khác mở lên tự nhập input (file check TOP + ngân sách) và nhận output giống quy trình 2 agent `seo-offpage-technical` → `offpage-pm` trong repo này, nhưng chạy trực tiếp trong trình duyệt bằng API key Anthropic của chính họ.

**Link chạy thật:** https://nguyenthilinhtrang.github.io/offpage-bao-gp/

> **Lưu ý:** đây là bản build thử (proof of concept) minh hoạ hệ thống agent/skill có thể chạy được ngoài Claude Code, không phải sản phẩm chính thức. Không có hosting riêng hay trả phí duy trì — chạy trên GitHub Pages miễn phí, cố tình dừng ở mức thao tác cơ bản để không phát sinh chi phí (kể cả chi phí gọi API khi test). Công việc offpage thật hàng ngày vẫn thực hiện trực tiếp trên VS Code tích hợp Claude Code, không qua web app này.

## Cấu trúc trang — 3 khối

1. **Khối 1 — Giới thiệu**: thuần text, giải thích công cụ là gì, làm gì, phần nào miễn phí/phần nào mất phí.
2. **Khối 2 — Phần miễn phí**: upload file check TOP → 1 nút bấm → ra kết quả ngay (bảng thống kê TOP theo BTK + danh sách từ khoá ứng viên đáng đầu tư offpage kèm lý do). **Không cần API key** cho khối này.
3. **Khối 3 — Phần cần trả phí**: ô nhập API key nằm ở đây (không phải đầu trang) vì chỉ khối này cần. Gồm 2 bước con: 3a ghép cụm anchor theo chủ đề, 3b chọn domain báo/GP theo ngân sách. Xuất kết quả cuối ra Excel.

## Kiến trúc

- **Không có server/backend** — 100% HTML/CSS/JS tĩnh, deploy qua GitHub Pages (source: nhánh `main`, folder `/docs`).
- **Bring-your-own-key** — người dùng tự nhập Anthropic API key ở Khối 3, lưu trong `localStorage` của trình duyệt họ, gọi thẳng tới `api.anthropic.com` qua header `anthropic-dangerous-direct-browser-access: true` (cơ chế CORS chính thức của Anthropic cho browser). Key không đi qua server nào của mình.
- **Bảng giá sống** — fetch trực tiếp CSV từ 2 Google Sheet giá báo/GP (public, hỗ trợ CORS qua endpoint `gviz/tq?tqx=out:csv`) ở bước 3b, không cần copy dữ liệu tĩnh vào repo. Người dùng cũng có thể tự upload danh sách domain đã lọc sẵn để bỏ qua bước fetch này.
- **Khối 2 chạy 100% offline, không gọi API:**
  - Thống kê TOP theo BTK, tính `%keyword_in_top10` theo URL, lọc ứng viên (Bước 1-4 của skill `top-rank-backlink-analysis`) chạy bằng JS thuần trong trình duyệt — dù file check TOP dài hàng nghìn dòng cũng không tốn token (xem `computeStage1Free` trong `app.js`).
  - Nhận diện cột "Từ khoá"/"URL"/"TOP hiện tại" trong file CSV: JS tự đoán sẵn (ưu tiên cột tên "Now" cho TOP hiện tại, tránh nhầm với cột "AIO" — đã test thực tế phát hiện lỗi này với file check TOP thật), hiện ra dropdown để người dùng **tự xác nhận hoặc sửa lại** trước khi tính — không gọi LLM để làm việc này (khác với bản trước đó), giữ đúng yêu cầu Khối 2 không cần API key.
  - Bước 3b áp dụng lọc bớt dòng chắc chắn bị loại (Note ghi "tạm dừng"/"dừng bán") bằng JS trước khi gửi bảng giá lên Claude — không đổi kết quả, chỉ giảm token.
- **2 bước gọi API (Khối 3)** tương ứng đúng 2 agent:
  1. `seo-offpage-technical` (3a) — chỉ nhận danh sách ứng viên đã lọc sẵn từ Khối 2 (không phải file gốc), làm 2 việc: xét KPI-aware (nếu có file KPI) + ghép cụm anchor theo chủ đề, output ép theo JSON Schema (`output_config.format`).
  2. `offpage-pm` (3b) — system prompt rút gọn từ `.claude/skills/news-budget-selection` + `.claude/skills/guestpost-budget-selection`, input là output 3a + danh sách domain (tự upload hoặc bảng giá sống) + ngân sách người dùng nhập.
- **Xuất Excel** client-side bằng SheetJS (CDN), không qua server.

## Chạy thử local

```sh
cd docs
python3 -m http.server 8934
# mở http://localhost:8934
```

## Giới hạn đã biết

- Sheet guest post ~1250 dòng vẫn được gửi gần như nguyên vẹn vào bước 3b (chỉ trừ các dòng Note "tạm dừng"/"dừng bán") nếu người dùng không tự upload danh sách đã lọc sẵn — đây là phần tốn token nhất còn lại, vì việc khớp danh mục ngành GP với lĩnh vực website khách là phán đoán ngữ nghĩa, không thể lọc an toàn bằng JS thuần. Hiển thị ước tính token trước khi gọi. Người dùng tự trả chi phí bằng API key của họ.
- Model mặc định là Claude Opus 5 (chất lượng cao nhất, cũng đắt nhất) — người dùng có thể đổi sang Sonnet 5/Haiku 4.5 ở Khối 3 nếu muốn tiết kiệm.
- Việc đoán cột ở Khối 2 chỉ là gợi ý mặc định — nếu file check TOP có cấu trúc quá khác thường, người dùng cần tự kiểm tra lại dropdown trước khi bấm chạy, công cụ không tự phát hiện lỗi chọn sai cột.
- Hiện chỉ tương đương 2 agent đầu (`seo-offpage-technical`, `offpage-pm`); chưa có bước `offpage-content` (viết bài thật).
