# Agent Offpage

Hệ thống 3 agent + 8 skill cho quy trình SEO Offpage (đi báo PR + guest post), dùng chung cho nhiều dự án khách hàng.

## Demo — agent chạy thật, không dàn dựng

`seo-offpage-technical` phân tích trực tiếp file check TOP thật (`data/hoptri/btk1-thuong-hieu-checktop.csv`) bằng skill `top-rank-backlink-analysis`, tự tính lại % TOP, tự phát hiện lệch KPI, tự đề xuất anchor text.

![Demo agent seo-offpage-technical](exports/demo-seo-offpage-technical.gif)

## Đọc trước

- [`summary.md`](summary.md) — trạng thái dự án, kết quả chạy thử thật (dự án Hợp Trí + Sunlife), lỗi đã phát hiện & sửa.
- [`CLAUDE.md`](CLAUDE.md) — quy ước kiến trúc + quy tắc làm việc.
- [`exports/hoptri-offpage-2026-07-12.md`](exports/hoptri-offpage-2026-07-12.md) — lịch sử trò chuyện đầy đủ lúc build hệ thống và chạy thử dự án Hợp Trí.

## Cấu trúc

```
.claude/agents/*.md          # 3 agent
.claude/skills/<ten-skill>/  # 8 skill
data/<du-an>/                # dữ liệu trung gian theo dự án
outputs/<du-an>/             # deliverable cuối cùng, tách file theo giai đoạn agent
  <DuAn>-AnchorText-<ngay>.xlsx   # output seo-offpage-technical (TOP, KPI, cụm anchor)
  <DuAn>-ChonDomain-<ngay>.xlsx   # output offpage-pm (domain + ngân sách) — deliverable cuối
exports/                     # lịch sử chat + demo ghi hình
```

## 3 agent

- **`seo-offpage-technical`** — phân tích file check TOP, đề xuất anchor text + ghép cụm 2 anchor/bài.
- **`offpage-pm`** — lọc domain báo/GP phù hợp lĩnh vực + ngân sách, chốt danh sách cuối.
- **`offpage-content`** — lên outline và viết content chèn anchor tự nhiên (chỉ dùng khi cần viết bài thật).

Thứ tự chạy chuẩn: `seo-offpage-technical` → `offpage-pm` → (tuỳ chọn) `offpage-content`.
