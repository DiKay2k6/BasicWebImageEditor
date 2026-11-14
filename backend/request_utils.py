"""Tiện ích đọc ảnh upload và tham số xử lý từ request (dùng chung cho nhiều API)."""

from dataclasses import dataclass
from typing import Any, Dict

import numpy as np
from flask import request

from image_io import ImageProcessingError, validate_and_decode_image


@dataclass(frozen=True)
class UploadedImage:
    image: np.ndarray
    output_ext: str  # '.jpg' hoặc '.png'
    filename: str
    size: int


def read_uploaded_image(*field_names: str) -> UploadedImage:
    """Đọc file ảnh từ multipart/form-data, kiểm tra hợp lệ và giải mã bằng OpenCV."""
    fields = field_names or ("image", "file")
    uploaded_file = next(
        (request.files[name] for name in fields if name in request.files), None
    )
    if uploaded_file is None or not uploaded_file.filename:
        raise ImageProcessingError(
            "Vui lòng tải lên một file ảnh hợp lệ (JPG, JPEG hoặc PNG)."
        )

    file_bytes = uploaded_file.read()
    image, output_ext = validate_and_decode_image(
        file_bytes=file_bytes,
        filename=uploaded_file.filename,
        content_type=uploaded_file.mimetype or "",
    )
    return UploadedImage(image, output_ext, uploaded_file.filename, len(file_bytes))


def read_processing_params() -> Dict[str, Any]:
    """Lấy tham số xử lý ảnh từ form-data (ưu tiên) hoặc JSON body."""
    if request.form:
        return request.form.to_dict()
    json_data = request.get_json(silent=True) if request.is_json else None
    return dict(json_data) if isinstance(json_data, dict) else {}
