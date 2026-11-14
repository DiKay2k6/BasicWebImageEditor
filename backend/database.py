"""Kết nối MongoDB (khởi tạo lười - lazy) và tạo index cho các collection."""

import threading

from flask import current_app
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

_EXTENSION_KEY = "mongo_db"
_init_lock = threading.Lock()


def _ensure_indexes(db: Database) -> None:
    """Tạo index cần thiết (idempotent - gọi nhiều lần không lỗi)."""
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.sessions.create_index([("token_hash", ASCENDING)], unique=True)
    db.sessions.create_index([("user_id", ASCENDING)])
    # TTL index: MongoDB tự xóa phiên đăng nhập khi hết hạn
    db.sessions.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
    db.edit_history.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])


def get_db() -> Database:
    """Trả về đối tượng Database dùng chung cho ứng dụng Flask hiện tại.

    Kết nối chỉ được tạo khi lần đầu cần dùng, nhờ đó các chức năng xử lý ảnh
    vẫn hoạt động bình thường ngay cả khi MongoDB chưa chạy.
    """
    app = current_app._get_current_object()
    db = app.extensions.get(_EXTENSION_KEY)
    if db is not None:
        return db

    with _init_lock:
        db = app.extensions.get(_EXTENSION_KEY)
        if db is None:
            client: MongoClient = MongoClient(
                app.config["MONGO_URI"],
                serverSelectionTimeoutMS=app.config["MONGO_TIMEOUT_MS"],
                tz_aware=True,
            )
            db = client[app.config["MONGO_DB_NAME"]]
            try:
                _ensure_indexes(db)
            except Exception:
                client.close()
                raise
            app.extensions[_EXTENSION_KEY] = db
    return db
