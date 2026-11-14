"""API lịch sử chỉnh sửa: lưu ảnh kết quả vào thư mục lưu trữ, metadata + đường dẫn vào MongoDB."""

import os
from typing import Tuple

from flask import Blueprint, Response, g, jsonify, request, send_file
from pymongo import DESCENDING

from database import get_db
from errors import ApiError
from image_io import encode_image
from image_service import describe_pipeline_edits, process_image_operation_with_metadata
from request_utils import read_processing_params, read_uploaded_image
from security import login_required, utcnow
from serializers import serialize_history_item
from storage import delete_file, resolve_file, save_file
from validators import parse_object_id, parse_positive_int

history_bp = Blueprint("history", __name__, url_prefix="/api/history")

DEFAULT_PAGE_SIZE = 12
MAX_PAGE_SIZE = 50
MAX_FILENAME_LENGTH = 120


def _find_owned_item(item_id: str) -> dict:
    item = get_db().edit_history.find_one(
        {"_id": parse_object_id(item_id), "user_id": g.user["_id"]}
    )
    if item is None:
        raise ApiError("Không tìm thấy bản ghi lịch sử chỉnh sửa.", 404)
    return item


@history_bp.get("")
@login_required
def list_history() -> Tuple[Response, int]:
    page = parse_positive_int(request.args.get("page"), 1, 10_000)
    limit = parse_positive_int(request.args.get("limit"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
    query = {"user_id": g.user["_id"]}

    collection = get_db().edit_history
    cursor = (
        collection.find(query)
        .sort("created_at", DESCENDING)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    return (
        jsonify(
            {
                "items": [serialize_history_item(item) for item in cursor],
                "total": collection.count_documents(query),
                "page": page,
                "limit": limit,
            }
        ),
        200,
    )


@history_bp.post("")
@login_required
def save_history() -> Tuple[Response, int]:
    """Nhận ảnh gốc + tham số chỉnh sửa, xử lý lại bằng OpenCV rồi lưu kết quả.

    Xử lý phía server đảm bảo ảnh lưu trữ và metadata (kích thước, số khuôn mặt)
    luôn khớp với các tham số đã ghi nhận.
    """
    uploaded = read_uploaded_image("image", "file")
    params = read_processing_params()
    params["operation"] = "pipeline"

    result, metadata = process_image_operation_with_metadata(uploaded.image, params)
    encoded, mime_type = encode_image(result, uploaded.output_ext)
    image_path = save_file(f"edits/{g.user['_id']}", uploaded.output_ext, encoded)

    original_h, original_w = uploaded.image.shape[:2]
    out_h, out_w = result.shape[:2]
    item = {
        "user_id": g.user["_id"],
        "original_filename": os.path.basename(uploaded.filename)[:MAX_FILENAME_LENGTH],
        "image_path": image_path,
        "mime_type": mime_type,
        "width": out_w,
        "height": out_h,
        "original_width": original_w,
        "original_height": original_h,
        "file_size": len(encoded),
        "faces_detected": metadata.get("faces_detected", 0),
        "edits": describe_pipeline_edits(params),
        "created_at": utcnow(),
    }
    try:
        item["_id"] = get_db().edit_history.insert_one(item).inserted_id
    except Exception:
        delete_file(image_path)  # Không để lại file mồ côi khi ghi DB thất bại
        raise

    return (
        jsonify({"item": serialize_history_item(item), "message": "Đã lưu vào lịch sử chỉnh sửa."}),
        201,
    )


@history_bp.get("/<item_id>/image")
@login_required
def get_history_image(item_id: str) -> Response:
    item = _find_owned_item(item_id)
    return send_file(resolve_file(item["image_path"]), mimetype=item["mime_type"])


@history_bp.delete("/<item_id>")
@login_required
def delete_history(item_id: str) -> Tuple[Response, int]:
    item = _find_owned_item(item_id)
    get_db().edit_history.delete_one({"_id": item["_id"]})
    delete_file(item["image_path"])
    return jsonify({"message": "Đã xóa bản ghi lịch sử."}), 200
