# Web app — Lập kế hoạch SEO Offpage

Trang web tĩnh (không backend), người khác mở lên tự nhập input (file check TOP + ngân sách) và nhận output giống quy trình 2 agent `seo-offpage-technical` → `offpage-pm` trong repo này, nhưng chạy trực tiếp trong trình duyệt bằng API key Anthropic của chính họ.

## Kiến trúc

- **Không có server/backend** — 100% HTML/CSS/JS tĩnh, deploy qua GitHub Pages.
- **Bring-your-own-key** — người dùng tự nhập Anthropic API key, lưu trong `localStorage` của trình duyệt họ, gọi thẳng tới `api.anthropic.com` qua header `anthropic-dangerous-direct-browser-access: true` (cơ chế CORS chính thức của Anthropic cho browser). Key không đi qua server nào của mình.
- **Bảng giá sống** — fetch trực tiếp CSV từ 2 Google Sheet giá báo/GP (public, hỗ trợ CORS qua endpoint `gviz/tq?tqx=out:csv`) ngay trong bước 2, không cần copy dữ liệu tĩnh vào repo.
- **2 bước gọi API** tương ứng đúng 2 agent:
  1. `seo-offpage-technical` — system prompt rút gọn từ `.claude/skills/top-rank-backlink-analysis` + `.claude/skills/anchor-text-clustering`, input là file check TOP người dùng upload, output ép theo JSON Schema (`output_config.format`) để hiển thị bảng trực tiếp.
  2. `offpage-pm` — system prompt rút gọn từ `.claude/skills/news-budget-selection` + `.claude/skills/guestpost-budget-selection`, input là output bước 1 + 2 bảng giá sống + ngân sách người dùng nhập.
- **Xuất Excel** client-side bằng SheetJS (CDN), không qua server.

## Chạy thử local

```sh
cd docs
python3 -m http.server 8934
# mở http://localhost:8934
```

## Giới hạn đã biết

- Sheet guest post ~1250 dòng được gửi nguyên vẹn vào bước 2 để đúng nguyên tắc "đọc toàn bộ sheet trước khi kết luận" — tốn khá nhiều token input mỗi lần chạy (hiển thị ước tính token trước khi gọi). Người dùng tự trả chi phí bằng API key của họ.
- Model mặc định là Claude Opus 5 (chất lượng cao nhất, cũng đắt nhất) — người dùng có thể đổi sang Sonnet 5/Haiku 4.5 ở mục 0 nếu muốn tiết kiệm.
- Hiện chỉ tương đương 2 agent đầu (`seo-offpage-technical`, `offpage-pm`); chưa có bước `offpage-content` (viết bài thật).
