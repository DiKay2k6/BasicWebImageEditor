"""Kiểm tra dữ liệu đầu vào cho các API tài khoản, hồ sơ và lịch sử."""

import re
from typing import Any, Dict

from bson import ObjectId
from bson.errors import InvalidId
from flask import request

from errors import ApiError

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
EMAIL_MAX_LENGTH = 254
PASSWORD_MIN_LENGTH = 6
PASSWORD_MAX_LENGTH = 128
DISPLAY_NAME_MIN_LENGTH = 2
DISPLAY_NAME_MAX_LENGTH = 50
BIO_MAX_LENGTH = 300


def get_json_body() -> Dict[str, Any]:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("Dữ liệu gửi lên phải là JSON hợp lệ.")
    return data


def _as_text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def validate_email(value: Any) -> str:
    email = _as_text(value).lower()
    if not email:
        raise ApiError("Vui lòng nhập email.")
    if len(email) > EMAIL_MAX_LENGTH or not EMAIL_PATTERN.match(email):
        raise ApiError("Email không đúng định dạng.")
    return email


def validate_password(value: Any, label: str = "Mật khẩu") -> str:
    # Không strip mật khẩu: khoảng trắng là ký tự hợp lệ người dùng chủ động nhập
    password = value if isinstance(value, str) else ""
    if not password:
        raise ApiError(f"Vui lòng nhập {label.lower()}.")
    if not PASSWORD_MIN_LENGTH <= len(password) <= PASSWORD_MAX_LENGTH:
        raise ApiError(
            f"{label} phải có từ {PASSWORD_MIN_LENGTH} đến {PASSWORD_MAX_LENGTH} ký tự."
        )
    if not password.strip():
        raise ApiError(f"{label} không được chỉ gồm khoảng trắng.")
    return password


def validate_display_name(value: Any) -> str:
    name = " ".join(_as_text(value).split())
    if not DISPLAY_NAME_MIN_LENGTH <= len(name) <= DISPLAY_NAME_MAX_LENGTH:
        raise ApiError(
            f"Tên hiển thị phải có từ {DISPLAY_NAME_MIN_LENGTH} đến {DISPLAY_NAME_MAX_LENGTH} ký tự."
        )
    return name


def validate_bio(value: Any) -> str:
    bio = _as_text(value)
    if len(bio) > BIO_MAX_LENGTH:
        raise ApiError(f"Tiểu sử tối đa {BIO_MAX_LENGTH} ký tự.")
    return bio


def parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise ApiError("Không tìm thấy dữ liệu yêu cầu.", 404) from exc


def parse_positive_int(value: Any, default: int, max_value: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return min(max(parsed, 1), max_value)
