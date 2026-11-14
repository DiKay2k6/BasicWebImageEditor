"""Cấu hình ứng dụng, đọc từ biến môi trường với giá trị mặc định cho môi trường phát triển."""

import os
from typing import Any, Dict

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "..", "frontend"))


def load_config() -> Dict[str, Any]:
    """Tạo dict cấu hình cho Flask (app.config)."""
    return {
        # Giới hạn 20MB mỗi request (ảnh upload)
        "MAX_CONTENT_LENGTH": 20 * 1024 * 1024,
        # Giới hạn riêng cho ảnh đại diện
        "MAX_AVATAR_BYTES": 5 * 1024 * 1024,
        "AVATAR_SIZE": 256,
        # MongoDB chỉ lưu dữ liệu người dùng, hồ sơ, metadata và đường dẫn ảnh
        "MONGO_URI": os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017"),
        "MONGO_DB_NAME": os.environ.get("MONGO_DB_NAME", "basic_web_image_editor"),
        "MONGO_TIMEOUT_MS": int(os.environ.get("MONGO_TIMEOUT_MS", "3000")),
        # File ảnh được lưu riêng trong thư mục lưu trữ (không lưu Base64/Binary trong MongoDB)
        "STORAGE_DIR": os.path.abspath(
            os.environ.get("STORAGE_DIR", os.path.join(BACKEND_DIR, "storage"))
        ),
        "SESSION_TTL_DAYS": int(os.environ.get("SESSION_TTL_DAYS", "7")),
    }
