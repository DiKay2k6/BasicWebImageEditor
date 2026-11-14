"""API xử lý ảnh bằng OpenCV (không yêu cầu đăng nhập, không dùng MongoDB)."""

import io
from typing import Tuple

from flask import Blueprint, Response, jsonify, send_file

from image_io import ALLOWED_EXTENSIONS, ImageProcessingError, encode_image
from image_service import (
    SUPPORTED_OPERATIONS,
    UNIMPLEMENTED_OPERATIONS,
    process_image_operation_with_metadata,
)
from processing import detect_faces
from request_utils import read_processing_params, read_uploaded_image

image_bp = Blueprint("image", __name__, url_prefix="/api")


@image_bp.get("/health")
def health_check() -> Tuple[Response, int]:
    """Kiểm tra trạng thái hoạt động của Backend và danh sách thao tác hỗ trợ."""
    return (
        jsonify(
            {
                "status": "ok",
                "supported_formats": sorted(ALLOWED_EXTENSIONS),
                "supported_operations": sorted(SUPPORTED_OPERATIONS),
                "unimplemented_operations": sorted(UNIMPLEMENTED_OPERATIONS),
            }
        ),
        200,
    )


@image_bp.post("/process")
def process_image() -> Response:
    """Tiếp nhận ảnh và tham số từ Frontend, gọi hàm OpenCV và trả về ảnh kết quả."""
    uploaded = read_uploaded_image("image", "file")
    processed_image, metadata = process_image_operation_with_metadata(
        uploaded.image, read_processing_params()
    )
    if processed_image is None:
        raise ImageProcessingError("Quá trình xử lý ảnh bằng OpenCV thất bại.", status_code=500)

    out_h, out_w = processed_image.shape[:2]
    encoded_bytes, mimetype = encode_image(processed_image, uploaded.output_ext)

    response = send_file(
        io.BytesIO(encoded_bytes),
        mimetype=mimetype,
        as_attachment=False,
        download_name=f"processed{uploaded.output_ext}",
    )
    response.headers["X-Image-Width"] = str(out_w)
    response.headers["X-Image-Height"] = str(out_h)
    response.headers["X-Faces-Detected"] = str(metadata.get("faces_detected", 0))
    return response


@image_bp.post("/detect-faces")
def detect_image_faces() -> Tuple[Response, int]:
    """Phát hiện khuôn mặt trong ảnh bằng OpenCV và trả về danh sách tọa độ khuôn mặt."""
    uploaded = read_uploaded_image("image", "file")
    faces = detect_faces(uploaded.image)
    return (
        jsonify(
            {
                "status": "ok",
                "faces_count": len(faces),
                "faces": [{"x": x, "y": y, "width": w, "height": h} for (x, y, w, h) in faces],
            }
        ),
        200,
    )
