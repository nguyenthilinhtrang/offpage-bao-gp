# Ghi chú cấu trúc dữ liệu — bảng giá báo

Chỉ đọc file này khi cần đối chiếu format cột hoặc cách hiểu Note, không cần load mặc định khi chạy skill (luôn ưu tiên đọc sheet sống để lấy giá/tình trạng mới nhất, file này chỉ mô tả *cấu trúc*, không phải nguồn giá).

## Khối "Báo tỉnh/địa phương" — ví dụ dòng dữ liệu
```
STT | Tên báo | DR | Traffic | Link Do | Giá | Note | Demo
1 | https://baodanang.vn/ | 65 | 350.264 | 2 | 850.000 | <1000 từ + 3-5 ảnh | (link demo)
2 | https://baotayninh.vn | 53 | 344.200 | 2 | 700.000 | <800 từ + 3 ảnh/Tạm dừng nhận từ 20/08 | (link demo)
```
Giá phổ biến ở khối này: 700.000 – 1.500.000đ/bài (đúng như quy ước "báo đi từ 1-2 triệu" chỉ đúng cho nhóm giá cao hơn ở khối "Báo thường").

## Khối "Báo thường" — ví dụ dòng dữ liệu
```
STT | Tên báo | DR | Traffic | Link Do | Giá đại lý | Note
1 | https://plo.vn/ | 80 | 22.000.000 | 2 | 2.450.000 | <800 từ 2 ảnh (bài 2 link no 2,2tr)
12 | https://www.xaluannews.com/ | 70 | 142.800 | 0 | 1.200.000 | Bài 0 link - Mua 1 link 300K
```
Giá dao động rộng hơn: 600.000 – 2.450.000đ/bài.

## Cách đọc cột Note quan trọng
- `"Tạm dừng nhận"`, `"Dừng bán"` → loại khỏi danh sách khả dụng.
- `"Cần GPKD"` → website khách cần có giấy phép kinh doanh hợp lệ để đi báo này.
- `"Link Do = 0"` kèm note kiểu "Bài 0 link - Mua 1 link 300K" → bài mặc định không có link dofollow, phải mua thêm — cần tính thêm chi phí này vào skill `news-budget-selection` nếu chọn báo này.
- Giới hạn số từ/ảnh (VD "<800 từ + 3 ảnh") → chuyển thẳng cho Agent Content Offpage khi viết bài, đây là ràng buộc bắt buộc.
