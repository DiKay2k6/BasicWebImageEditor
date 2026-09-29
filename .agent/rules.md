# Quy chuẩn Phát triển Dự án — Web Image Editor

## 1. Ngôn ngữ & Giao tiếp
- **Ngôn ngữ:** Luôn phản hồi, giải thích code và viết tài liệu bằng tiếng Việt.
- **Phong cách:** Trả lời ngắn gọn, rõ ràng, đi thẳng vào vấn đề.
- **Xử lý lỗi:** Khi phát hiện lỗi, giải thích nguyên nhân trước khi đưa ra code sửa lỗi. Không giải thích quá dài nếu vấn đề có thể giải quyết bằng một hướng đơn giản.

## 2. Quy tắc làm việc với Project
- **Khảo sát trước khi sửa:** Trước khi sửa code, PHẢI kiểm tra cấu trúc project và các file liên quan. Không được giả định cấu trúc project nếu chưa kiểm tra file thực tế.
- **Kế thừa:** Ưu tiên sử dụng và chỉnh sửa code hiện có thay vì viết lại từ đầu.
- **Phạm vi tác động:** Chỉ sửa những file cần thiết cho yêu cầu. KHÔNG tự ý xóa, đổi tên, di chuyển file hoặc tạo nhiều file mới nếu chức năng có thể triển khai hợp lý trong các file hiện có.
- **Giới hạn Refactor:** Không tự ý refactor toàn bộ project khi người dùng chỉ yêu cầu sửa một chức năng. Sau khi sửa, phải kiểm tra các phần liên quan để tránh làm hỏng chức năng hiện tại.
- **Bảo toàn kiến trúc:** Không thay đổi kiến trúc hoặc Tech Stack nếu chưa được yêu cầu.

## 3. Tech Stack cố định
- **Frontend:** HTML5, Tailwind CSS, JavaScript thuần (Vanilla JS).
  - *Cấm:* Không dùng React, Vue, Angular, hoặc CSS framework khác.
  - *Thư viện:* Ưu tiên Web API và Native JS API. Ưu tiên Fetch API thay vì Axios.
- **Frontend State:** Sử dụng JavaScript thuần để quản lý. Dùng Stack cho lịch sử chỉnh sửa (Undo/Redo). Không lạm dụng Stack cho các state đơn giản (loading, UI state).
- **Backend:** Python, Flask framework, RESTful API.
  - *Cấm:* Không thay bằng FastAPI, Django, Node.js.
- **Image Processing:** Sử dụng OpenCV. Logic xử lý ảnh phải được tách biệt khỏi phần routing/API.
- **Database:** MongoDB.
  - Chỉ lưu metadata cần thiết và đường dẫn/thông tin tham chiếu đến file ảnh.
  - *Cấm:* Không lưu trực tiếp file ảnh (Base64/Binary) vào DB.
  - *Bảo mật:* Không hard-code password, API key. Sử dụng biến môi trường (.env).
- **Deployment:** Docker, Docker Compose, Nginx (Reverse Proxy).

## 4. Clean Code & Tổ chức file
- **HTML / JavaScript:**
  - Tách biệt HTML và JS. Không viết toàn bộ logic JS trực tiếp trong thẻ script của HTML.
  - Nếu project lớn, tách thành các module: `editor.js`, `api.js`, `state.js`, `history.js`.
  - Không tạo module mới chỉ để làm code phức tạp hơn. Ưu tiên dễ đọc, dễ bảo trì.
- **Python / Flask:**
  - Tuân thủ PEP 8.
  - Sử dụng Type Hint cho các hàm Python.
  - Tách biệt routing và image processing logic. Không dồn toàn bộ logic vào một file app duy nhất.
  - Không áp dụng các design pattern/abstraction không cần thiết.

## 5. Xử lý ảnh (Backend)
- **Kiểm duyệt đầu vào:** Backend bắt buộc kiểm tra file trước khi đưa vào OpenCV.
- **Định dạng hỗ trợ:** JPG/JPEG, PNG.
- **Kiểm tra an toàn:** Đảm bảo file tồn tại, đúng định dạng, và OpenCV có thể đọc được (không tin tưởng hoàn toàn vào đuôi file).
- **Bắt lỗi:** Không để file không hợp lệ làm crash server. Các thao tác xử lý ảnh phải được bọc trong khối exception phù hợp.

## 6. Frontend Error Handling
- Tất cả API request đều phải có xử lý lỗi. Bọc `try/catch` cho các thao tác bất đồng bộ.
- Kiểm tra HTTP status trước khi xử lý response.
- Hiển thị thông báo thân thiện (Toast, Alert) cho người dùng. Tuyệt đối không hiển thị stack trace hoặc thông tin nhạy cảm của server lên UI.

## 7. Hiệu năng & Tối ưu hóa
- Ưu tiên xử lý các thao tác preview đơn giản ở phía Client (nếu phù hợp) để giảm tải Server.
- Tránh gọi lại API hoặc xử lý lại các file ảnh lớn nếu dữ liệu hiện tại vẫn có thể sử dụng.
- Ưu tiên giải pháp đơn giản. Không thêm caching phức tạp nếu chưa có vấn đề hiệu năng thực tế.

## 8. Triển khai (Docker)
- Dockerfile phải phản ánh đúng dependency thực tế. Ưu tiên image nhỏ gọn và build cache hiệu quả (khuyến khích multi-stage build).
- Không tự ý thay đổi port đang được project sử dụng.
- Nếu port hoặc biến môi trường thay đổi, bắt buộc phải cập nhật: `.env`, `docker-compose.yml`, và cấu hình Nginx.

## 9. Cấm Over-engineering (Chống phức tạp hóa)
- Ưu tiên giải pháp đơn giản nhất.
- Không thêm thư viện nếu Native API đã đáp ứng.
- Không tạo abstraction chỉ để cho "ngầu" hay "chuyên nghiệp".
- Tuyệt đối không tự ý triển khai microservices, Redis, Kafka, Celery, Kubernetes nếu không có yêu cầu rõ ràng.
- Không refactor code đang chạy tốt nếu không phục vụ trực tiếp cho task hiện tại.

## 10. Quy trình thực thi (Dành cho AI Agent)
Khi nhận một yêu cầu thay đổi, Agent phải tuần tự thực hiện:
1. Đọc kỹ và xác định chính xác chức năng cần sửa.
2. Kiểm tra cấu trúc project và đọc các file liên quan.
3. Xác định nguyên nhân/vị trí cần can thiệp.
4. Chọn giải pháp đơn giản nhất, giữ nguyên kiến trúc.
5. Chỉ sửa các file thực sự cần thiết.
6. Báo cáo lại cho người dùng: 
   - Đã thay đổi file nào? 
   - Đã thay đổi gì? 
   - Lý do thay đổi? 
   - Có rủi ro/vấn đề nào còn tồn đọng không?

## 11. Nguyên tắc Bất di bất dịch (High Priority)
1. **KHÔNG** tự ý thay đổi Tech Stack.
2. **KHÔNG** tự ý thay đổi kiến trúc project.
3. **KHÔNG** over-engineering.
4. **PHẢI** kiểm tra code hiện có trước khi sửa.
5. Chỉ thay đổi đúng trọng tâm để hoàn thành yêu cầu.