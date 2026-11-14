"""Băm mật khẩu, quản lý phiên đăng nhập (lưu trong MongoDB) và decorator login_required."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any, Callable, Dict, Optional

from bson import ObjectId
from flask import current_app, g, request
from werkzeug.security import check_password_hash, generate_password_hash

from database import get_db
from errors import ApiError


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    if not password_hash:
        return False
    try:
        return check_password_hash(password_hash, password)
    except ValueError:  # Hash không đúng định dạng của Werkzeug
        return False


def _hash_token(token: str) -> str:
    """Chỉ lưu SHA-256 của token, để lộ DB cũng không dùng được token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(user_id: ObjectId) -> str:
    """Tạo phiên đăng nhập mới và trả về token gửi cho Frontend."""
    token = secrets.token_urlsafe(32)
    now = utcnow()
    get_db().sessions.insert_one(
        {
            "token_hash": _hash_token(token),
            "user_id": user_id,
            "created_at": now,
            "expires_at": now + timedelta(days=current_app.config["SESSION_TTL_DAYS"]),
        }
    )
    return token


def revoke_session(token: str) -> None:
    get_db().sessions.delete_one({"token_hash": _hash_token(token)})


def revoke_other_sessions(user_id: ObjectId, keep_token: str) -> None:
    """Đăng xuất khỏi mọi thiết bị khác (dùng khi đổi mật khẩu)."""
    get_db().sessions.delete_many(
        {"user_id": user_id, "token_hash": {"$ne": _hash_token(keep_token)}}
    )


def _read_bearer_token() -> Optional[str]:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


def _find_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    session = db.sessions.find_one(
        {"token_hash": _hash_token(token), "expires_at": {"$gt": utcnow()}}
    )
    if session is None:
        return None
    return db.users.find_one({"_id": session["user_id"]})


def login_required(view: Callable) -> Callable:
    """Yêu cầu header 'Authorization: Bearer <token>' hợp lệ; gán g.user và g.auth_token."""

    @wraps(view)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        token = _read_bearer_token()
        user = _find_user_by_token(token) if token else None
        if user is None:
            raise ApiError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.", 401)
        g.user = user
        g.auth_token = token
        return view(*args, **kwargs)

    return wrapper
