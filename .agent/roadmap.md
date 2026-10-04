> File này là nguồn tham chiếu về lộ trình và trạng thái phát triển của project.
> AI Agent phải đọc file này trước khi thực hiện task liên quan đến project.
> `.agent/rules.md` chứa các quy tắc bắt buộc khi chỉnh sửa project.
> `.agent/roadmap.md` chứa lộ trình và trạng thái hiện tại.
> Hai file này có vai trò khác nhau và không được thay thế cho nhau.

# Lộ trình phát triển từng bước — Web Image Editor

## Trạng thái hiện tại

- Mốc Frontend Prototype: Hoàn thành
- Giai đoạn hiện tại: Giai đoạn 1 – Python + OpenCV
- Giai đoạn 1: Đang thực hiện
- Các bước tích hợp Web: Chưa bắt đầu

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

# Mốc đã hoàn thành trước khi điều chỉnh quy trình giảng viên – Frontend Prototype

Các công việc dưới đây đã được hoàn thành và đóng băng. **KHÔNG** xóa, bỏ qua hoặc thay thế các nội dung này. Không sửa code Frontend trong Giai đoạn 1.

* Frontend bằng HTML5 + Tailwind CSS.
* Giao diện UI/UX của Web Image Editor.
* Login / Register / Profile UI.
* Upload và Preview ảnh.
* UI Filtering:
  * Grayscale
  * Blur
  * Brightness
  * Contrast
  * Sharpen
  * Edge Detection
* UI Transforming:
  * Crop
  * Resize
  * Rotate
  * Flip
* Vanilla JavaScript interactions.
* Upload validation.
* Local state.
* Undo / Redo bằng Stack.
* Compare Original / Current.
* Download.

---

# Giai đoạn 1: Python + OpenCV

### Mục tiêu
Làm quen với Python và sử dụng OpenCV để xử lý ảnh độc lập, chưa tích hợp vào Web.

### 1. Làm quen Python
* Cài đặt Python.
* Cài Python Extension cho VS Code.
* Chạy được Hello World.
* Làm quen với file `.py`.
* Làm quen với Notebook `.ipynb`.
* Có thể sử dụng Google Colab khi cần.

### 2. Làm quen OpenCV
* Cài đặt OpenCV.
* Import và sử dụng OpenCV.
* Đọc / mở ảnh.
* Hiển thị ảnh.
* Lưu ảnh sau khi xử lý.

### 3. Thực hành xử lý ảnh
Thực hành bằng Python + OpenCV:
* Grayscale.
* Blur.
* Resize.
* Rotate.
* Flip.
* Brightness.
* Contrast.
* Sharpen.
* Edge Detection.
* Crop.
* Có thể thực hành thêm các thao tác xử lý ảnh khác phù hợp với đề tài.

### 4. Cấu trúc tổ chức Giai đoạn 1
Dự kiến tạo thư mục `image_processing/` độc lập với cấu trúc:
```text
image_processing/
├── python_basics/
├── opencv_basics/
├── notebooks/
├── input/
└── output/
```
*(Không tạo Flask/API/Database/Docker chỉ để phục vụ Giai đoạn 1)*

### 5. Yêu cầu tái sử dụng code
* Các thao tác xử lý ảnh phải được viết thành các hàm Python rõ ràng (vd: `def grayscale_image(image):`).
* Tên hàm và tham số dễ hiểu.
* Không phụ thuộc vào giao diện Web, không hard-code theo trang HTML cụ thể.
* Viết code sao cho có thể tái sử dụng khi tích hợp Web sau này.
* **Chưa tích hợp** các hàm này vào Flask hoặc Frontend trong Giai đoạn 1.

---

# Các giai đoạn tương lai (Tích hợp Web)

Sau khi Giai đoạn 1 (Python + OpenCV) hoàn thành và được người dùng xác nhận, nhóm mới bắt đầu bước tích hợp phần xử lý ảnh vào Web. 

Các công nghệ và thành phần (Flask, REST API, MongoDB, Docker, Nginx) đã được xác định trong `.agent/rules.md` vẫn được bảo toàn cho các giai đoạn sau.
