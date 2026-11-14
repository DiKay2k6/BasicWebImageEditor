"""Chuyển document MongoDB sang JSON trả về Frontend (không bao giờ trả password_hash)."""

from datetime import datetime
from typing import Any, Dict, Optional


def _iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def serialize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "display_name": user["display_name"],
        "bio": user.get("bio", ""),
        "has_avatar": bool(user.get("avatar_path")),
        "created_at": _iso(user.get("created_at")),
        "updated_at": _iso(user.get("updated_at")),
    }


def serialize_history_item(item: Dict[str, Any]) -> Dict[str, Any]:
    item_id = str(item["_id"])
    return {
        "id": item_id,
        "original_filename": item["original_filename"],
        "image_url": f"/api/history/{item_id}/image",
        "mime_type": item["mime_type"],
        "width": item["width"],
        "height": item["height"],
        "original_width": item["original_width"],
        "original_height": item["original_height"],
        "file_size": item["file_size"],
        "faces_detected": item.get("faces_detected", 0),
        "edits": item.get("edits", {}),
        "created_at": _iso(item.get("created_at")),
    }
