"""Module kiểm tra định dạng, giải mã (decode) và mã hóa (encode) file ảnh bằng OpenCV."""

from typing import Tuple

import cv2
import numpy as np

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg"}
JPEG_MAGIC = b"\xff\xd8\xff"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"


class ImageProcessingError(Exception):
    """Lỗi nghiệp vụ khi kiểm tra định dạng, giải mã/mã hóa hoặc xử lý ảnh."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def validate_and_decode_image(
    file_bytes: bytes, filename: str, content_type: str = ""
) -> Tuple[np.ndarray, str]:
    """Kiểm tra định dạng file và giải mã ảnh trong bộ nhớ bằng OpenCV.

    Trả về tuple (image_ndarray, ext_format) với ext_format là '.jpg' hoặc '.png'.
    """
    if not filename or "." not in filename:
        raise ImageProcessingError("Tên file không hợp lệ hoặc thiếu phần mở rộng.")

    ext = filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ImageProcessingError(
            "Định dạng file không được hỗ trợ. Vui lòng chọn ảnh JPG, JPEG hoặc PNG."
        )

    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        raise ImageProcessingError(
            "Kiểu dữ liệu (MIME type) không hợp lệ. Chỉ chấp nhận JPG, JPEG hoặc PNG."
        )

    if not file_bytes:
        raise ImageProcessingError("File ảnh rỗng hoặc không có dữ liệu.")

    # Kiểm tra chữ ký byte (magic bytes) thực tế của file để không phụ thuộc hoàn toàn vào đuôi file
    is_jpeg = file_bytes.startswith(JPEG_MAGIC)
    is_png = file_bytes.startswith(PNG_MAGIC)
    if not (is_jpeg or is_png):
        raise ImageProcessingError(
            "Nội dung file không phải định dạng ảnh JPG/JPEG hoặc PNG hợp lệ."
        )

    file_array = np.frombuffer(file_bytes, dtype=np.uint8)
    image = cv2.imdecode(file_array, cv2.IMREAD_COLOR)

    if image is None or image.size == 0:
        raise ImageProcessingError(
            "OpenCV không thể đọc được file ảnh này. File có thể đã bị hỏng."
        )

    output_ext = ".png" if is_png else ".jpg"
    return image, output_ext


def encode_image(image: np.ndarray, output_ext: str = ".jpg") -> Tuple[bytes, str]:
    """Mã hóa ảnh OpenCV (numpy.ndarray) sang bytes để trả về HTTP response."""
    if image is None or image.size == 0:
        raise ImageProcessingError("Không thể xuất ảnh kết quả rỗng.", status_code=500)

    ext = ".png" if output_ext == ".png" else ".jpg"
    mimetype = "image/png" if ext == ".png" else "image/jpeg"

    success, encoded = cv2.imencode(ext, image)
    if not success:
        raise ImageProcessingError("Lỗi khi mã hóa ảnh kết quả.", status_code=500)

    return encoded.tobytes(), mimetype
