> File này là nguồn tham chiếu về lộ trình và trạng thái phát triển của project.
> AI Agent phải đọc file này trước khi thực hiện task liên quan đến project.
> `.agent/rules.md` chứa các quy tắc bắt buộc khi chỉnh sửa project.
> `.agent/roadmap.md` chứa lộ trình và trạng thái hiện tại.
> Hai file này có vai trò khác nhau và không được thay thế cho nhau.

# Lộ trình phát triển từng bước — Web Image Editor

## Trạng thái hiện tại

- Giai đoạn hiện tại: Giai đoạn 2
- Trạng thái hiện tại: Hoàn thành (Hoàn tất toàn bộ Giai đoạn 2, chờ bắt đầu Giai đoạn 3)
- Giai đoạn 1: Hoàn thành
- Giai đoạn 2: Hoàn thành
- Giai đoạn 3: Chưa bắt đầu
- Giai đoạn 4: Chưa bắt đầu
- Giai đoạn 5: Chưa bắt đầu

### Quy tắc cập nhật trạng thái

- Chỉ cập nhật trạng thái sau khi đã thực hiện và kiểm tra thực tế.
- Không đánh dấu hoàn thành nếu chức năng chưa được kiểm tra.
- Không tự chuyển sang giai đoạn tiếp theo.
- Chỉ chuyển sang giai đoạn tiếp theo khi người dùng xác nhận.
- Nếu còn lỗi hoặc chức năng chưa hoàn thành, ghi rõ trong trạng thái.

## Quy tắc thực hiện chung

AI Agent phải thực hiện dự án **theo đúng thứ tự từng giai đoạn**.

* Chỉ thực hiện **một giai đoạn tại một thời điểm**.
* Sau khi hoàn thành một giai đoạn, phải kiểm tra các phần đã thực hiện và báo cáo kết quả cho người dùng.
* **Không tự động chuyển sang giai đoạn tiếp theo.**
* Chỉ được chuyển sang giai đoạn tiếp theo khi người dùng xác nhận.
* Khi thực hiện mỗi giai đoạn, phải tuân thủ toàn bộ quy định trong `.agent/rules.md`.
* Không tự ý thay đổi Tech Stack hoặc kiến trúc project.
* Trước khi sửa code, phải kiểm tra cấu trúc project và các file liên quan.
* Chỉ thay đổi những file thực sự cần thiết cho giai đoạn hiện tại.

---

# Giai đoạn 1: Dựng Frontend & Giao diện UI/UX

### Mục tiêu

Xây dựng giao diện chính của Web Image Editor bằng **HTML5 + Tailwind CSS + Vanilla JavaScript**, tập trung vào UI/UX.

### Công việc

* Sử dụng HTML5 kết hợp Tailwind CSS để xây dựng giao diện hiện đại.
* Áp dụng hiệu ứng Glassmorphism nếu phù hợp với thiết kế.
* Thiết kế giao diện:

  * Đăng ký.
  * Đăng nhập.
  * Quản lý tài khoản cá nhân.
* Thiết kế khu vực upload ảnh từ thiết bị.
* Thiết kế khu vực hiển thị ảnh.
* Thiết kế các nút và thanh điều khiển cho Filtering:

  * Grayscale.
  * Blur.
  * Brightness.
  * Contrast.
  * Sharpen.
  * Edge Detection.
* Thiết kế các nút điều khiển Transforming:

  * Crop.
  * Resize.
  * Rotate.
  * Flip.
* Thiết kế Undo / Redo.
* Thiết kế khu vực so sánh ảnh gốc và ảnh đang chỉnh sửa.
* Thiết kế nút Download ảnh.

### Giới hạn của Giai đoạn 1

Tập trung vào **giao diện và cấu trúc Frontend**.

Chưa cần triển khai:

* Flask API.
* MongoDB.
* OpenCV.
* Docker.
* Nginx.

Sau khi hoàn thành, kiểm tra giao diện và báo cáo cho người dùng.

**Chỉ chuyển sang Giai đoạn 2 khi người dùng xác nhận.**

---

# Giai đoạn 2: Xử lý Logic Frontend bằng JavaScript

### Mục tiêu

Hoàn thiện các tương tác và trạng thái của trình chỉnh sửa ảnh bằng **Vanilla JavaScript**.

### Công việc

* Xử lý sự kiện trên giao diện.
* Kiểm tra file ảnh khi người dùng upload.
* Chỉ hỗ trợ:

  * JPG.
  * JPEG.
  * PNG.
* Hiển thị ảnh được chọn lên giao diện.
* Quản lý Local State bằng JavaScript.
* Sử dụng **Stack** để quản lý lịch sử chỉnh sửa:

  * Undo.
  * Redo.
* Xử lý việc so sánh ảnh gốc và ảnh hiện tại.
* Hạn chế các API request hoặc xử lý không cần thiết.
* Xử lý chức năng Download ảnh.
* Xử lý lỗi và hiển thị thông báo phù hợp cho người dùng.

### Giới hạn của Giai đoạn 2

Chỉ tập trung vào **logic Frontend**.

Các chức năng xử lý ảnh thật bằng OpenCV và API Backend sẽ được thực hiện ở các giai đoạn sau.

Sau khi hoàn thành, kiểm tra các chức năng Frontend và báo cáo cho người dùng.

**Chỉ chuyển sang Giai đoạn 3 khi người dùng xác nhận.**

---

# Giai đoạn 3: Xây dựng Backend & Database

### Mục tiêu

Xây dựng Backend bằng **Python + Flask** và kết nối **MongoDB**.

## Flask

* Khởi tạo Flask Backend.
* Xây dựng RESTful API.
* Xây dựng API upload ảnh.
* Tiếp nhận file ảnh từ Frontend.
* Kiểm tra file đầu vào ở Backend.
* Tiếp nhận các lệnh/tham số chỉnh sửa ảnh từ Frontend.
* Chuẩn bị API để trả về ảnh kết quả JPG/JPEG hoặc PNG.

## MongoDB

* Kết nối Flask với MongoDB.
* Xây dựng dữ liệu quản lý người dùng.
* Lưu thông tin cần thiết cho tài khoản.
* Lưu lịch sử chỉnh sửa ảnh.
* Lưu metadata cần thiết của ảnh.
* Lưu đường dẫn hoặc thông tin tham chiếu đến file ảnh.
* Không lưu trực tiếp file ảnh dưới dạng Base64/Binary trong MongoDB.
* Không hard-code password hoặc API key; sử dụng biến môi trường.

### Tổ chức Backend

Logic xử lý ảnh phải được tách biệt khỏi routing/API theo quy định trong `.agent/rules.md`.

### Giới hạn của Giai đoạn 3

Giai đoạn này tập trung vào **Flask + REST API + MongoDB**.

Các thuật toán xử lý ảnh bằng OpenCV được triển khai ở Giai đoạn 4.

Sau khi hoàn thành, kiểm tra API, Database và kết nối Frontend → Backend.

**Chỉ chuyển sang Giai đoạn 4 khi người dùng xác nhận.**

---

# Giai đoạn 4: Tích hợp xử lý ảnh bằng OpenCV

### Mục tiêu

Tích hợp OpenCV vào Flask Backend để thực hiện các thao tác chỉnh sửa ảnh.

### Filtering

Triển khai:

* Grayscale.
* Gaussian Blur.
* Brightness.
* Contrast.
* Sharpen bằng convolution kernel/mask.
* Edge Detection.

### Transforming

Triển khai:

* Crop.
* Resize.
* Rotate.
* Flip.

### Yêu cầu

* Kiểm tra file trước khi đưa vào OpenCV.
* Đảm bảo file tồn tại.
* Kiểm tra định dạng JPG/JPEG/PNG.
* Kiểm tra OpenCV có thể đọc được file.
* Không để file không hợp lệ làm crash server.
* Xử lý exception phù hợp.
* Logic xử lý ảnh tiếp tục được tách biệt khỏi routing/API.

### Tích hợp

Kết nối:

Frontend
   ↓
Flask REST API
   ↓
Image Processing
   ↓
OpenCV
   ↓
Ảnh kết quả
   ↓
Frontend

Sau khi hoàn thành, kiểm tra toàn bộ các chức năng Filtering và Transforming.

**Chỉ chuyển sang Giai đoạn 5 khi người dùng xác nhận.**

---

# Giai đoạn 5: Tích hợp hệ thống & Triển khai Docker/Nginx

### Mục tiêu

Đóng gói và kết nối toàn bộ hệ thống bằng **Docker, Docker Compose và Nginx**.

### Docker

* Xây dựng Dockerfile phù hợp với dependency thực tế.
* Đảm bảo Flask và OpenCV hoạt động trong Docker.
* Ưu tiên image nhỏ gọn và build cache hiệu quả.
* Có thể sử dụng multi-stage build khi phù hợp.

### Docker Compose

* Cấu hình các service cần thiết.
* Cấu hình network giữa các service.
* Cấu hình environment variables.
* Đảm bảo MongoDB và Backend kết nối đúng.
* Đảm bảo các file ảnh cần thiết được lưu trữ phù hợp.

### Nginx

* Sử dụng Nginx làm Reverse Proxy.
* Điều hướng request giữa Frontend và Backend.
* Cấu hình Nginx phù hợp với Docker Compose.

### Kiểm tra toàn hệ thống

Kiểm tra luồng chính:

                    ┌──→ OpenCV → Ảnh kết quả
                    │
User → Frontend → Nginx → Flask REST API
                              │
                              └──→ MongoDB

Kiểm tra:

* Đăng ký.
* Đăng nhập.
* Upload ảnh.
* Filtering.
* Transforming.
* Undo / Redo.
* So sánh ảnh.
* Lưu lịch sử chỉnh sửa.
* Download ảnh.
* Kết nối MongoDB.
* Docker Compose.
* Nginx Reverse Proxy.

Nếu port hoặc environment variables thay đổi, cập nhật các cấu hình liên quan theo `.agent/rules.md`.

Sau khi toàn bộ hệ thống hoạt động ổn định, báo cáo kết quả cuối cùng cho người dùng.
