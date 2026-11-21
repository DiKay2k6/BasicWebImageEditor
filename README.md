# Web Image Editor (OpenCV + Flask + MongoDB)

Ứng dụng web chỉnh sửa ảnh tích hợp xử lý ảnh **OpenCV**, nhận diện và làm mờ khuôn mặt bằng mô hình AI **YuNet ONNX**, đi kèm hệ thống quản lý tài khoản, hồ sơ người dùng và lịch sử chỉnh sửa trên **MongoDB**.

---

## Điểm nổi bật kỹ thuật

- **Pipeline xử lý ảnh OpenCV bất biến (Non-destructive)**:
  - **Bộ lọc & màu sắc**: Độ sáng (Brightness), Độ tương phản (Contrast), Làm mờ (Gaussian Blur), Ảnh xám (Grayscale), Làm sắc nét (Sharpen bằng ma trận tích chập), Phát hiện cạnh (Canny Edge Detection).
  - **Biến đổi hình học**: Xoay 90°/180°/270°, Lật ngang/dọc, Đổi kích thước (giữ tỉ lệ khung hình), Cắt ảnh tự do (Interactive Free Crop 8 điểm kéo).
- **Nhận diện & làm mờ khuôn mặt (Face Detection & Privacy Blur)**:
  - Sử dụng mô hình **YuNet ONNX (`cv2.FaceDetectorYN`)** quét đa góc xoay (0°, 90°, 180°, 270°), tự động cân bằng sáng cục bộ **CLAHE (hệ màu LAB)** cho ảnh ngược sáng/thiếu sáng, lọc trùng khung hình và dự phòng bằng **Haar Cascade**.
  - Hỗ trợ 2 chế độ che mặt: **Gaussian Blur** và **Pixelate (Mosaic)**, kèm tùy chọn vẽ khung nhận diện trực quan.
- **Trải nghiệm người dùng (UX) & Quản lý trạng thái**:
  - Hỗ trợ **Undo / Redo** (`Ctrl+Z` / `Ctrl+Y`), tự động khôi phục trạng thái giao diện khi xảy ra lỗi xử lý, nhấn giữ để **So sánh (Compare)** với ảnh gốc, và **Tải xuống (Download)** ảnh kết quả.
  - Chế độ khách (**Guest Mode**) hoạt động độc lập: kết nối MongoDB được khởi tạo lười (*lazy connection*), cho phép chỉnh sửa ảnh ngay cả khi chưa bật dịch vụ MongoDB.
- **Bảo mật & Kiến trúc lưu trữ chuẩn**:
  - Mật khẩu băm bằng `Werkzeug Security`; phiên đăng nhập dùng Bearer Token ngẫu nhiên nhưng chỉ lưu bản băm **SHA-256** trong MongoDB kèm **TTL Index** tự động dọn phiên hết hạn; tự động thu hồi phiên trên thiết bị khác khi đổi mật khẩu.
  - Kiểm tra chữ ký byte thực tế (**Magic Bytes** JPEG/PNG) và chặn truy cập vượt thư mục (**Path Traversal Protection**).
  - **Tách biệt Database & File Storage**: MongoDB chỉ lưu thông tin người dùng, phiên, metadata chỉnh sửa và đường dẫn tương đối; file ảnh vật lý lưu riêng trên ổ đĩa (`STORAGE_DIR`), **tuyệt đối không lưu ảnh dạng Base64/Binary trong MongoDB**.

---

## Công nghệ sử dụng

| Tầng | Công nghệ |
| --- | --- |
| **Backend** | Python 3, Flask, OpenCV (`opencv-python`), NumPy, PyMongo, Werkzeug |
| **AI / Computer Vision** | OpenCV YuNet ONNX (`face_detection_yunet_2023mar.onnx`), Haar Cascades |
| **Database & Storage** | MongoDB (Metadata, Users, Sessions) + Local Filesystem Storage (Ảnh vật lý) |
| **Frontend** | HTML5, Tailwind CSS v4, Vanilla JavaScript (ES6 Modules), Fetch API |

---

## Cấu trúc thư mục

```text
BasicWebImageEditor/
├── backend/
│   ├── app.py                   # Điểm khởi chạy ứng dụng Flask, CORS & xử lý lỗi tập trung
│   ├── config.py                # Cấu hình biến môi trường và đường dẫn hệ thống
│   ├── routes/                  # Tầng điều hướng API (Flask Blueprints)
│   │   ├── auth_routes.py       # Đăng ký, đăng nhập, đăng xuất, phiên hiện tại
│   │   ├── profile_routes.py    # Hồ sơ cá nhân, đổi mật khẩu, ảnh đại diện
│   │   ├── history_routes.py    # Lưu, truy vấn phân trang và xóa lịch sử chỉnh sửa
│   │   └── image_routes.py      # Xử lý ảnh OpenCV, nhận diện khuôn mặt, healthcheck
│   ├── services/                # Tầng nghiệp vụ cốt lõi (Core Business Logic)
│   │   ├── processing.py        # Thuật toán OpenCV: bộ lọc, biến đổi hình học, YuNet Face Blur
│   │   ├── image_service.py     # Điều phối pipeline xử lý ảnh và trích xuất metadata
│   │   ├── database.py          # Kết nối MongoDB (lazy) và khởi tạo Index / TTL Index
│   │   ├── security.py          # Băm mật khẩu, quản lý token phiên & @login_required
│   │   └── storage.py           # Lưu/đọc/xóa file ảnh vật lý trên ổ đĩa an toàn
│   ├── utils/                   # Tiện ích kiểm tra dữ liệu, giải mã ảnh và định dạng JSON
│   │   ├── errors.py            # Lớp ngoại lệ nghiệp vụ ApiError
│   │   ├── image_io.py          # Kiểm tra magic bytes, giải mã/mã hóa ảnh OpenCV
│   │   ├── request_utils.py     # Đọc ảnh upload và tham số xử lý từ HTTP request
│   │   ├── validators.py        # Kiểm tra hợp lệ đầu vào (email, mật khẩu, hồ sơ, phân trang)
│   │   └── serializers.py       # Chuyển đổi dữ liệu MongoDB sang JSON trả về client
│   ├── models/                  # Trọng số mô hình nhận diện khuôn mặt YuNet ONNX
│   └── cascades/                # Dữ liệu Haar Cascade dự phòng
├── frontend/
│   ├── index.html               # Giao diện không gian làm việc chính (Image Editor)
│   ├── pages/                   # Các trang Đăng nhập, Đăng ký, Hồ sơ & Lịch sử
│   └── assets/
│       ├── css/                 # Tailwind CSS (input.css & style.css)
│       └── js/
│           ├── main.js          # Điểm khởi tạo trang Editor chính
│           ├── editor/          # Các module công cụ chỉnh sửa (state, upload, filters, transforms, crop, history, compare-download, account)
│           ├── pages/           # Logic cho các trang login.js, register.js, profile.js
│           ├── services/        # Giao tiếp API (api.js, auth-client.js)
│           └── utils/           # Tiện ích dùng chung (config, notifications, file-utils, form-utils, edit-history-view)
├── requirements.txt
└── package.json
```

---

## Hướng dẫn cài đặt & Chạy ứng dụng

1. **Cài đặt thư viện Python**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Khởi động MongoDB** (mặc định tại `mongodb://127.0.0.1:27017`).
3. **Chạy máy chủ Flask**:
   ```bash
   cd backend && python app.py
   ```
4. **Mở trình duyệt**: Truy cập <http://127.0.0.1:5055>

*(Tùy chọn)* Biên dịch lại CSS khi chỉnh sửa giao diện Tailwind:
```bash
npm run build:css
```

### Cấu hình biến môi trường (đều có giá trị mặc định)

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `MONGO_URI` | `mongodb://127.0.0.1:27017` | Địa chỉ kết nối MongoDB |
| `MONGO_DB_NAME` | `basic_web_image_editor` | Tên cơ sở dữ liệu |
| `STORAGE_DIR` | `backend/storage` | Thư mục lưu trữ file ảnh vật lý |
| `SESSION_TTL_DAYS` | `7` | Thời hạn phiên đăng nhập (ngày) |
| `PORT` | `5055` | Cổng chạy máy chủ Flask |

---

## Thiết kế cơ sở dữ liệu & Lưu trữ

- **MongoDB** chỉ lưu dữ liệu tài khoản, hồ sơ, phiên đăng nhập, metadata chỉnh sửa và **đường dẫn tương đối tới file ảnh**:
  - `users`: `email` (unique index), `password_hash`, `display_name`, `bio`, `avatar_path`, mốc thời gian tạo/cập nhật/đăng nhập.
  - `sessions`: `token_hash` (SHA-256, unique index), `user_id`, `expires_at` (TTL index tự động xóa khi hết hạn).
  - `edit_history`: `user_id` + `created_at` (compound index), `original_filename`, `image_path`, `mime_type`, kích thước trước/sau (`original_width`, `original_height`, `width`, `height`), `file_size`, `faces_detected`, `edits` (chi tiết bộ lọc & phép biến đổi đã áp dụng).
- **Thư mục lưu trữ (`STORAGE_DIR`)**: Lưu file ảnh vật lý trong `avatars/` và `edits/<user_id>/`. Tự động dọn file cũ khi đổi ảnh đại diện, xóa file khi xóa lịch sử, và rollback file nếu ghi cơ sở dữ liệu thất bại.

---

## Danh sách API Endpoints

| Method | Đường dẫn | Xác thực | Mô tả |
| --- | --- | :---: | --- |
| `GET` | `/api/health` | Không | Kiểm tra trạng thái máy chủ và danh sách thao tác hỗ trợ |
| `POST` | `/api/process` | Không | Xử lý ảnh theo pipeline OpenCV, trả về ảnh kèm header kích thước & số khuôn mặt |
| `POST` | `/api/detect-faces` | Không | Phát hiện khuôn mặt và trả về danh sách tọa độ |
| `POST` | `/api/auth/register` | Không | Đăng ký tài khoản mới |
| `POST` | `/api/auth/login` | Không | Đăng nhập và nhận Bearer Token |
| `POST` | `/api/auth/logout` | Có | Đăng xuất và hủy phiên hiện tại |
| `GET` | `/api/auth/me` | Có | Lấy thông tin người dùng hiện tại |
| `GET` · `PUT` | `/api/profile` | Có | Xem hồ sơ (kèm thống kê số ảnh đã lưu) / Cập nhật tên hiển thị & tiểu sử |
| `PUT` | `/api/profile/password` | Có | Đổi mật khẩu và đăng xuất các thiết bị khác |
| `GET` · `POST` | `/api/profile/avatar` | Có | Tải ảnh đại diện / Cập nhật ảnh đại diện (tự động cắt vuông & thu nhỏ) |
| `GET` · `POST` | `/api/history` | Có | Danh sách lịch sử chỉnh sửa (có phân trang) / Lưu kết quả chỉnh sửa mới |
| `PUT` | `/api/history/<id>` | Có | Cập nhật ảnh và metadata mới nhất cho bản ghi lịch sử đã lưu |
| `GET` | `/api/history/<id>/image` | Có | Tải file ảnh của một bản ghi lịch sử |
| `DELETE` | `/api/history/<id>` | Có | Xóa bản ghi lịch sử và xóa file ảnh tương ứng trên ổ đĩa |

*Các API yêu cầu xác thực sử dụng header `Authorization: Bearer <token>`.*
