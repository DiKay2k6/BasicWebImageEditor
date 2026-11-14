"""API hồ sơ: xem/cập nhật thông tin, đổi mật khẩu, ảnh đại diện."""

from typing import Tuple

from flask import Blueprint, Response, current_app, g, jsonify, send_file
from pymongo import ReturnDocument

from database import get_db
from errors import ApiError
from image_io import encode_image
from image_service import create_avatar_image
from request_utils import read_uploaded_image
from security import hash_password, login_required, revoke_other_sessions, utcnow, verify_password
from serializers import serialize_user
from storage import delete_file, resolve_file, save_file
from validators import get_json_body, validate_bio, validate_display_name, validate_password

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")


def _update_current_user(changes: dict) -> dict:
    changes["updated_at"] = utcnow()
    return get_db().users.find_one_and_update(
        {"_id": g.user["_id"]},
        {"$set": changes},
        return_document=ReturnDocument.AFTER,
    )


@profile_bp.get("")
@login_required
def get_profile() -> Tuple[Response, int]:
    edit_count = get_db().edit_history.count_documents({"user_id": g.user["_id"]})
    return jsonify({"user": serialize_user(g.user), "stats": {"edit_count": edit_count}}), 200


@profile_bp.put("")
@login_required
def update_profile() -> Tuple[Response, int]:
    data = get_json_body()
    user = _update_current_user(
        {
            "display_name": validate_display_name(data.get("display_name")),
            "bio": validate_bio(data.get("bio")),
        }
    )
    return jsonify({"user": serialize_user(user), "message": "Đã cập nhật hồ sơ."}), 200


@profile_bp.put("/password")
@login_required
def change_password() -> Tuple[Response, int]:
    data = get_json_body()
    current_password = data.get("current_password")
    if not isinstance(current_password, str) or not verify_password(
        g.user.get("password_hash", ""), current_password
    ):
        raise ApiError("Mật khẩu hiện tại không chính xác.")

    new_password = validate_password(data.get("new_password"), "Mật khẩu mới")
    if new_password == current_password:
        raise ApiError("Mật khẩu mới phải khác mật khẩu hiện tại.")

    _update_current_user({"password_hash": hash_password(new_password)})
    revoke_other_sessions(g.user["_id"], keep_token=g.auth_token)
    return jsonify({"message": "Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất."}), 200


@profile_bp.post("/avatar")
@login_required
def upload_avatar() -> Tuple[Response, int]:
    uploaded = read_uploaded_image("avatar", "image")
    if uploaded.size > current_app.config["MAX_AVATAR_BYTES"]:
        raise ApiError("Ảnh đại diện tối đa 5MB.", 413)

    avatar = create_avatar_image(uploaded.image, current_app.config["AVATAR_SIZE"])
    encoded, _ = encode_image(avatar, uploaded.output_ext)
    new_path = save_file("avatars", uploaded.output_ext, encoded)

    old_path = g.user.get("avatar_path")
    user = _update_current_user({"avatar_path": new_path})
    delete_file(old_path)
    return jsonify({"user": serialize_user(user), "message": "Đã cập nhật ảnh đại diện."}), 200


@profile_bp.get("/avatar")
@login_required
def get_avatar() -> Response:
    if not g.user.get("avatar_path"):
        raise ApiError("Bạn chưa có ảnh đại diện.", 404)
    return send_file(resolve_file(g.user["avatar_path"]))
