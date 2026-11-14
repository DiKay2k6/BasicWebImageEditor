"""Lưu trữ file ảnh trên ổ đĩa. MongoDB chỉ giữ đường dẫn tương đối tới file."""

import os
import uuid
from typing import Optional

from flask import current_app

from errors import ApiError


def _storage_root() -> str:
    return current_app.config["STORAGE_DIR"]


def save_file(folder: str, extension: str, data: bytes) -> str:
    """Ghi dữ liệu ra file mới với tên ngẫu nhiên, trả về đường dẫn tương đối (dạng 'a/b/c.jpg')."""
    relative_dir = folder.strip("/").replace("\\", "/")
    absolute_dir = os.path.join(_storage_root(), *relative_dir.split("/"))
    os.makedirs(absolute_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    with open(os.path.join(absolute_dir, filename), "wb") as file:
        file.write(data)
    return f"{relative_dir}/{filename}"


def resolve_file(relative_path: Optional[str]) -> str:
    """Chuyển đường dẫn tương đối thành tuyệt đối, chặn truy cập ra ngoài thư mục lưu trữ."""
    if not relative_path:
        raise ApiError("Không tìm thấy file ảnh.", 404)

    root = os.path.abspath(_storage_root())
    absolute_path = os.path.abspath(os.path.join(root, *relative_path.split("/")))
    if os.path.commonpath([root, absolute_path]) != root or not os.path.isfile(absolute_path):
        raise ApiError("Không tìm thấy file ảnh trong thư mục lưu trữ.", 404)
    return absolute_path


def delete_file(relative_path: Optional[str]) -> None:
    """Xóa file nếu tồn tại; bỏ qua nếu file đã bị xóa trước đó."""
    try:
        os.remove(resolve_file(relative_path))
    except (ApiError, OSError):
        pass
