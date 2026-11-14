"""API tài khoản: đăng ký, đăng nhập, đăng xuất, lấy thông tin người dùng hiện tại."""

from typing import Tuple

from flask import Blueprint, Response, g, jsonify
from pymongo.errors import DuplicateKeyError

from database import get_db
from errors import ApiError
from security import (
    create_session,
    hash_password,
    login_required,
    revoke_session,
    utcnow,
    verify_password,
)
from serializers import serialize_user
from validators import get_json_body, validate_display_name, validate_email, validate_password

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _session_response(user: dict, status_code: int) -> Tuple[Response, int]:
    token = create_session(user["_id"])
    return jsonify({"token": token, "user": serialize_user(user)}), status_code


@auth_bp.post("/register")
def register() -> Tuple[Response, int]:
    data = get_json_body()
    display_name = validate_display_name(data.get("display_name"))
    email = validate_email(data.get("email"))
    password = validate_password(data.get("password"))

    now = utcnow()
    user = {
        "email": email,
        "password_hash": hash_password(password),
        "display_name": display_name,
        "bio": "",
        "avatar_path": None,
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
    }
    try:
        user["_id"] = get_db().users.insert_one(user).inserted_id
    except DuplicateKeyError as exc:
        raise ApiError("Email này đã được đăng ký. Vui lòng dùng email khác.", 409) from exc

    return _session_response(user, 201)


@auth_bp.post("/login")
def login() -> Tuple[Response, int]:
    data = get_json_body()
    email = validate_email(data.get("email"))
    password = data.get("password")
    if not isinstance(password, str) or not password:
        raise ApiError("Vui lòng nhập mật khẩu.")

    users = get_db().users
    user = users.find_one({"email": email})
    if user is None or not verify_password(user.get("password_hash", ""), password):
        raise ApiError("Email hoặc mật khẩu không chính xác.", 401)

    users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": utcnow()}})
    return _session_response(user, 200)


@auth_bp.post("/logout")
@login_required
def logout() -> Tuple[Response, int]:
    revoke_session(g.auth_token)
    return jsonify({"message": "Đã đăng xuất."}), 200


@auth_bp.get("/me")
@login_required
def current_user() -> Tuple[Response, int]:
    return jsonify({"user": serialize_user(g.user)}), 200
