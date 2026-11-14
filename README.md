# Web Image Editor (OpenCV + Flask + MongoDB)

Ứng dụng web chỉnh sửa ảnh bằng OpenCV, hỗ trợ phát hiện và làm mờ khuôn mặt, quản lý tài khoản và lịch sử chỉnh sửa.

## Chạy ứng dụng

1. Cài thư viện Python: `pip install -r requirements.txt`
2. Bật MongoDB (mặc định `mongodb://127.0.0.1:27017`).
3. Chạy backend: `cd backend && python app.py`
4. Mở trình duyệt: <http://127.0.0.1:5055>

Build lại CSS sau khi sửa class Tailwind: `npm run build:css`.

## Cấu hình (biến môi trường, đều có giá trị mặc định)

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `MONGO_URI` | `mongodb://127.0.0.1:27017` | Địa chỉ MongoDB |
| `MONGO_DB_NAME` | `basic_web_image_editor` | Tên database |
| `STORAGE_DIR` | `backend/storage` | Thư mục lưu file ảnh |
| `SESSION_TTL_DAYS` | `7` | Thời hạn phiên đăng nhập |
| `PORT` | `5055` | Cổng Flask |

## Lưu trữ dữ liệu

- **MongoDB** chỉ lưu dữ liệu người dùng, hồ sơ, phiên đăng nhập, metadata chỉnh sửa và **đường dẫn ảnh**:
  - `users`: email (unique), mật khẩu đã băm, tên hiển thị, tiểu sử, `avatar_path`.
  - `sessions`: SHA-256 của token đăng nhập, tự hết hạn bằng TTL index.
  - `edit_history`: tên file gốc, `image_path`, kích thước trước/sau, dung lượng, số khuôn mặt, các chỉnh sửa đã áp dụng.
- **File ảnh** (ảnh đại diện, ảnh đã chỉnh sửa) lưu riêng trong `STORAGE_DIR` (`avatars/`, `edits/<user_id>/`). Không lưu ảnh dạng Base64/Binary trong MongoDB.

## API

| Method | Đường dẫn | Mô tả |
| --- | --- | --- |
| POST | `/api/process` | Xử lý ảnh bằng OpenCV (không cần đăng nhập) |
| POST | `/api/detect-faces` | Phát hiện khuôn mặt |
| POST | `/api/auth/register` · `/api/auth/login` · `/api/auth/logout` | Đăng ký / đăng nhập / đăng xuất |
| GET | `/api/auth/me` | Người dùng hiện tại |
| GET · PUT | `/api/profile` | Xem / cập nhật hồ sơ |
| PUT | `/api/profile/password` | Đổi mật khẩu |
| GET · POST | `/api/profile/avatar` | Xem / đổi ảnh đại diện |
| GET · POST | `/api/history` | Danh sách (phân trang) / lưu ảnh vào lịch sử |
| GET | `/api/history/<id>/image` | Ảnh của một bản ghi |
| DELETE | `/api/history/<id>` | Xóa bản ghi và file ảnh |

Các API cần đăng nhập dùng header `Authorization: Bearer <token>`.
