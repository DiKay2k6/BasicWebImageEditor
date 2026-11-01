import json
from typing import Any, Dict, Tuple

import numpy as np

from image_io import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    JPEG_MAGIC,
    PNG_MAGIC,
    ImageProcessingError,
    encode_image,
    validate_and_decode_image,
)
from processing import (
    adjust_brightness,
    adjust_contrast,
    apply_blur,
    apply_edge_detection,
    apply_grayscale,
    apply_sharpen,
    blur_faces,
    crop_image,
    detect_faces,
    draw_face_boxes,
    flip_image,
    resize_image,
    rotate_image,
)

SUPPORTED_OPERATIONS = {
    "grayscale",
    "blur",
    "brightness",
    "contrast",
    "sharpen",
    "edge",
    "edge_detection",
    "crop",
    "resize",
    "rotate",
    "flip",
    "face_blur",
    "face_detect",
    "pipeline",
}
UNIMPLEMENTED_OPERATIONS: set[str] = set()

__all__ = [
    "ALLOWED_EXTENSIONS",
    "ALLOWED_MIME_TYPES",
    "JPEG_MAGIC",
    "PNG_MAGIC",
    "SUPPORTED_OPERATIONS",
    "UNIMPLEMENTED_OPERATIONS",
    "ImageProcessingError",
    "validate_and_decode_image",
    "encode_image",
    "process_image_operation",
    "process_image_operation_with_metadata",
]


def _parse_int(value: Any, name: str, min_val: int, max_val: int) -> int:
    """Chuyển đổi và kiểm tra giá trị số nguyên trong khoảng cho phép."""
    try:
        parsed = int(round(float(value)))
    except (ValueError, TypeError) as exc:
        raise ImageProcessingError(f"Tham số '{name}' phải là một số hợp lệ.") from exc

    if parsed < min_val or parsed > max_val:
        raise ImageProcessingError(
            f"Tham số '{name}' phải nằm trong khoảng từ {min_val} đến {max_val}."
        )
    return parsed


def _parse_float(value: Any, name: str, min_val: float, max_val: float) -> float:
    """Chuyển đổi và kiểm tra giá trị số thực trong khoảng cho phép."""
    try:
        parsed = float(value)
    except (ValueError, TypeError) as exc:
        raise ImageProcessingError(f"Tham số '{name}' phải là một số hợp lệ.") from exc

    if parsed < min_val or parsed > max_val:
        raise ImageProcessingError(
            f"Tham số '{name}' phải nằm trong khoảng từ {min_val} đến {max_val}."
        )
    return parsed


def _parse_bool(value: Any) -> bool:
    """Chuyển đổi giá trị sang boolean."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "on"}
    return bool(value)


def _map_clockwise_angle_to_opencv_func_arg(cw_angle: int) -> int:
    """Chuyển góc xoay theo chiều kim đồng hồ (CW) sang tham số angle của hàm rotate_image().

    Trong hàm rotate_image():
    - angle == 90  -> cv2.ROTATE_90_COUNTERCLOCKWISE (xoay trái 90 độ)
    - angle == 180 -> cv2.ROTATE_180 (xoay 180 độ)
    - angle == 270 hoặc -90 -> cv2.ROTATE_90_CLOCKWISE (xoay phải 90 độ)
    """
    normalized_cw = cw_angle % 360
    if normalized_cw == 90:
        return 270  # Xoay phải 90 độ (CLOCKWISE)
    if normalized_cw == 180:
        return 180
    if normalized_cw == 270:
        return 90  # Xoay trái 90 độ (COUNTERCLOCKWISE)
    return 0


def _execute_rotate(image: np.ndarray, raw_angle_val: Any) -> np.ndarray:
    """Kiểm tra góc xoay (bội số của 90 độ) và gọi hàm rotate_image."""
    deg = _parse_int(raw_angle_val, "angle", -360, 360)
    if deg % 90 != 0:
        raise ImageProcessingError(
            "Góc xoay chỉ hỗ trợ các bội số của 90 độ (90, 180, 270, -90)."
        )
    mapped = _map_clockwise_angle_to_opencv_func_arg(deg)
    if mapped == 0:
        return image
    out = rotate_image(image, mapped)
    return out if out is not None else image


def _execute_flip(
    image: np.ndarray, raw_direction: Any, strict: bool = False
) -> np.ndarray:
    """Kiểm tra hướng lật ('horizontal', 'vertical', 'both') và gọi hàm flip_image."""
    direction = str(raw_direction or "").strip().lower()
    if direction not in {"horizontal", "vertical", "both"}:
        if strict:
            raise ImageProcessingError(
                "Hướng lật ảnh (direction) phải là 'horizontal', 'vertical' hoặc 'both'."
            )
        return image
    out = flip_image(image, direction)
    return out if out is not None else image


def _execute_resize(
    image: np.ndarray,
    raw_w: Any,
    raw_h: Any,
    w_name: str = "width",
    h_name: str = "height",
    skip_if_same: bool = False,
) -> np.ndarray:
    """Kiểm tra chiều rộng, chiều cao và gọi hàm resize_image."""
    target_w = _parse_int(raw_w, w_name, 1, 10000)
    target_h = _parse_int(raw_h, h_name, 1, 10000)
    curr_h, curr_w = image.shape[:2]
    if skip_if_same and target_w == curr_w and target_h == curr_h:
        return image
    out = resize_image(image, target_w, target_h)
    return out if out is not None else image


def _execute_crop(image: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
    """Kiểm tra tham số vùng cắt tự do (x, y, width, height) và gọi hàm crop_image."""
    img_h, img_w = image.shape[:2]

    raw_x = params.get("x", params.get("crop_x"))
    raw_y = params.get("y", params.get("crop_y"))
    raw_w = params.get("width", params.get("crop_w"))
    raw_h = params.get("height", params.get("crop_h"))

    if raw_x is None or raw_y is None or raw_w is None or raw_h is None:
        raise ImageProcessingError(
            "Thiếu tọa độ vùng cắt (x, y, width, height). Vui lòng chọn vùng cắt trên ảnh."
        )

    try:
        x = int(round(float(raw_x)))
        y = int(round(float(raw_y)))
        w = int(round(float(raw_w)))
        h = int(round(float(raw_h)))
    except (ValueError, TypeError) as exc:
        raise ImageProcessingError(
            "Tọa độ và kích thước vùng cắt phải là số hợp lệ."
        ) from exc

    ref_w = params.get("ref_w")
    ref_h = params.get("ref_h")
    if ref_w is not None and ref_h is not None:
        try:
            rw = float(ref_w)
            rh = float(ref_h)
            if rw > 0 and rh > 0 and (abs(rw - img_w) > 1 or abs(rh - img_h) > 1):
                scale_x = img_w / rw
                scale_y = img_h / rh
                x = int(round(x * scale_x))
                y = int(round(y * scale_y))
                w = int(round(w * scale_x))
                h = int(round(h * scale_y))
        except (ValueError, TypeError):
            pass

    if w < 4 or h < 4:
        raise ImageProcessingError(
            "Vùng chọn cắt ảnh rỗng hoặc quá nhỏ (tối thiểu 4x4 px)."
        )

    if x < 0 or y < 0 or x >= img_w or y >= img_h:
        raise ImageProcessingError("Tọa độ vùng cắt nằm ngoài phạm vi của ảnh.")

    w = min(w, img_w - x)
    h = min(h, img_h - y)
    if w < 4 or h < 4:
        raise ImageProcessingError(
            "Kích thước vùng cắt sau khi giới hạn trong biên ảnh quá nhỏ."
        )

    cropped = crop_image(image, x=x, y=y, width=w, height=h)
    if cropped is None or cropped.size == 0:
        raise ImageProcessingError("Không thể cắt ảnh với vùng chọn đã cung cấp.")
    return cropped


def _execute_contrast(
    image: np.ndarray, params: Dict[str, Any], allow_alpha: bool = False
) -> np.ndarray:
    """Kiểm tra tham số độ tương phản (contrast hoặc alpha) và gọi hàm adjust_contrast."""
    if allow_alpha and "alpha" in params:
        alpha = _parse_float(params["alpha"], "alpha", 0.0, 3.0)
    else:
        contrast_val = _parse_int(params.get("contrast", 0), "contrast", -100, 100)
        if contrast_val == 0:
            return image
        alpha = max(0.0, 1.0 + (contrast_val / 100.0))
    out = adjust_contrast(image, alpha)
    return out if out is not None else image


def _execute_brightness(image: np.ndarray, raw_val: Any) -> np.ndarray:
    """Kiểm tra giá trị độ sáng (-100 đến 100) và gọi hàm adjust_brightness."""
    val = _parse_int(raw_val, "brightness", -100, 100)
    if val == 0:
        return image
    out = adjust_brightness(image, val)
    return out if out is not None else image


def _execute_blur(
    image: np.ndarray,
    params: Dict[str, Any],
    default_blur: int = 0,
    allow_kernel_size: bool = False,
) -> np.ndarray:
    """Kiểm tra mức độ làm mờ (blur hoặc kernel_size) và gọi hàm apply_blur."""
    if allow_kernel_size and "kernel_size" in params:
        k = _parse_int(params["kernel_size"], "kernel_size", 1, 99)
        if k % 2 == 0:
            k += 1
    else:
        blur_level = _parse_int(params.get("blur", default_blur), "blur", 0, 20)
        if blur_level == 0:
            return image
        k = blur_level * 2 + 1
    out = apply_blur(image, kernel_size=(k, k))
    return out if out is not None else image


def _execute_edge_detection(
    image: np.ndarray, params: Dict[str, Any]
) -> np.ndarray:
    """Kiểm tra ngưỡng Canny (low_threshold, high_threshold) và gọi hàm apply_edge_detection."""
    low_t = _parse_int(params.get("low_threshold", 100), "low_threshold", 0, 500)
    high_t = _parse_int(params.get("high_threshold", 200), "high_threshold", 1, 500)
    out = apply_edge_detection(image, low_threshold=low_t, high_threshold=high_t)
    return out if out is not None else image


def _apply_pipeline_transforms(
    image: np.ndarray, params: Dict[str, Any]
) -> np.ndarray:
    """Thực thi tuần tự chuỗi biến đổi hình học (Rotate, Flip, Crop, Resize) trong chế độ pipeline."""
    result = image

    if "transform_ops" in params and params["transform_ops"]:
        try:
            ops_list = (
                json.loads(params["transform_ops"])
                if isinstance(params["transform_ops"], str)
                else params["transform_ops"]
            )
        except (ValueError, TypeError) as exc:
            raise ImageProcessingError(
                "Dữ liệu chuỗi thao tác biến đổi (transform_ops) không hợp lệ."
            ) from exc

        if not isinstance(ops_list, list):
            raise ImageProcessingError("Tham số transform_ops phải là một danh sách.")

        for step in ops_list:
            if not isinstance(step, dict):
                continue
            step_type = str(step.get("type", "")).strip().lower()
            if step_type == "rotate":
                result = _execute_rotate(result, step.get("angle", 0))
            elif step_type == "flip":
                result = _execute_flip(result, step.get("direction", ""), strict=False)
            elif step_type == "crop":
                result = _execute_crop(result, step)
            elif step_type == "resize":
                curr_h, curr_w = result.shape[:2]
                result = _execute_resize(
                    result,
                    step.get("width", curr_w),
                    step.get("height", curr_h),
                    skip_if_same=True,
                )
        return result

    # Hỗ trợ tương thích ngược khi truyền tham số rời rạc
    result = _execute_rotate(result, params.get("rotate", 0))

    flip_h = _parse_bool(params.get("flip_h", False))
    flip_v = _parse_bool(params.get("flip_v", False))
    if flip_h and flip_v:
        result = _execute_flip(result, "both")
    elif flip_h:
        result = _execute_flip(result, "horizontal")
    elif flip_v:
        result = _execute_flip(result, "vertical")

    if _parse_bool(params.get("apply_crop", False)):
        result = _execute_crop(result, params)

    if _parse_bool(params.get("apply_resize", False)) or (
        "resize_w" in params and "resize_h" in params
    ):
        curr_h, curr_w = result.shape[:2]
        result = _execute_resize(
            result,
            params.get("resize_w", curr_w),
            params.get("resize_h", curr_h),
            w_name="resize_w",
            h_name="resize_h",
            skip_if_same=True,
        )

    return result


def _execute_face_blur(
    image: np.ndarray, params: Dict[str, Any], faces: list | None = None
) -> Tuple[np.ndarray, list]:
    """Kiểm tra tham số và thực thi làm mờ vùng khuôn mặt (Gaussian hoặc Pixelate)."""
    blur_strength = _parse_int(
        params.get("face_blur_strength", params.get("strength", 30)),
        "face_blur_strength",
        1,
        100,
    )
    blur_type = str(params.get("face_blur_type", params.get("blur_type", "gaussian"))).strip().lower()
    if blur_type not in {"gaussian", "pixelate"}:
        blur_type = "gaussian"

    detected = faces if faces is not None else detect_faces(image)
    blurred = blur_faces(
        image,
        faces=detected,
        blur_strength=blur_strength,
        blur_type=blur_type,
    )
    return (blurred if blurred is not None else image), detected


def _execute_face_detect(
    image: np.ndarray, params: Dict[str, Any], faces: list | None = None
) -> Tuple[np.ndarray, list]:
    """Kiểm tra và vẽ khung chữ nhật nhận diện khuôn mặt trực quan."""
    detected = faces if faces is not None else detect_faces(image)
    boxed = draw_face_boxes(image, faces=detected)
    return (boxed if boxed is not None else image), detected


def _apply_pipeline_filters(
    image: np.ndarray, params: Dict[str, Any], metadata: Dict[str, Any] | None = None
) -> np.ndarray:
    """Thực thi tuần tự các bộ lọc màu sắc, độ nét và nhận diện/làm mờ khuôn mặt trong chế độ pipeline."""
    result = image

    result = _execute_contrast(result, params)
    result = _execute_brightness(result, params.get("brightness", 0))
    result = _execute_blur(result, params, default_blur=0)

    if _parse_bool(params.get("sharpen", False)):
        out = apply_sharpen(result)
        result = out if out is not None else result

    if _parse_bool(params.get("grayscale", False)):
        out = apply_grayscale(result)
        result = out if out is not None else result

    if _parse_bool(params.get("edge_detection", False)):
        result = _execute_edge_detection(result, params)

    # Xử lý nhận diện và làm mờ khuôn mặt (Tuần 9-10)
    has_face_blur = _parse_bool(params.get("face_blur", False))
    has_face_box = _parse_bool(params.get("face_detect_box", False)) or _parse_bool(
        params.get("face_box", False)
    )

    if has_face_blur or has_face_box:
        faces = detect_faces(result)
        if metadata is not None:
            metadata["faces_detected"] = len(faces)
            metadata["faces"] = [
                {"x": x, "y": y, "width": w, "height": h} for (x, y, w, h) in faces
            ]

        if has_face_blur:
            result, _ = _execute_face_blur(result, params, faces=faces)

        if has_face_box:
            result, _ = _execute_face_detect(result, params, faces=faces)

    return result


def process_image_operation_with_metadata(
    image: np.ndarray, params: Dict[str, Any]
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Thực thi thao tác xử lý ảnh và trả về ảnh kết quả kèm thông tin metadata (như số khuôn mặt phát hiện)."""
    operation = str(params.get("operation", "pipeline")).strip().lower()

    if operation not in SUPPORTED_OPERATIONS:
        raise ImageProcessingError(
            f"Thao tác '{operation}' không hợp lệ hoặc không được hỗ trợ."
        )

    metadata: Dict[str, Any] = {"faces_detected": 0, "faces": []}
    result: np.ndarray = image

    if operation == "face_blur":
        result, faces = _execute_face_blur(result, params)
        if _parse_bool(params.get("face_detect_box", False)):
            result, _ = _execute_face_detect(result, params, faces=faces)
        metadata["faces_detected"] = len(faces)
        metadata["faces"] = [
            {"x": x, "y": y, "width": w, "height": h} for (x, y, w, h) in faces
        ]
        return result, metadata

    if operation == "face_detect":
        result, faces = _execute_face_detect(result, params)
        metadata["faces_detected"] = len(faces)
        metadata["faces"] = [
            {"x": x, "y": y, "width": w, "height": h} for (x, y, w, h) in faces
        ]
        return result, metadata

    if operation == "grayscale":
        out = apply_grayscale(result)
        return (out if out is not None else result), metadata

    if operation == "sharpen":
        out = apply_sharpen(result)
        return (out if out is not None else result), metadata

    if operation in {"edge", "edge_detection"}:
        return _execute_edge_detection(result, params), metadata

    if operation == "crop":
        return _execute_crop(result, params), metadata

    if operation == "blur":
        return _execute_blur(
            result, params, default_blur=5, allow_kernel_size=True
        ), metadata

    if operation == "brightness":
        return _execute_brightness(
            result, params.get("value", params.get("brightness", 0))
        ), metadata

    if operation == "contrast":
        return _execute_contrast(result, params, allow_alpha=True), metadata

    if operation == "resize":
        orig_h, orig_w = result.shape[:2]
        return _execute_resize(
            result,
            params.get("width", params.get("resize_w", orig_w)),
            params.get("height", params.get("resize_h", orig_h)),
        ), metadata

    if operation == "rotate":
        return _execute_rotate(result, params.get("angle", params.get("rotate", 0))), metadata

    if operation == "flip":
        return _execute_flip(result, params.get("direction", ""), strict=True), metadata

    # Chế độ pipeline: Thực thi tuần tự Transforms -> Filters & Face Blur
    result = _apply_pipeline_transforms(result, params)
    result = _apply_pipeline_filters(result, params, metadata=metadata)
    return result, metadata


def process_image_operation(
    image: np.ndarray, params: Dict[str, Any]
) -> np.ndarray:
    """Thực thi thao tác xử lý ảnh bằng cách gọi các hàm trong backend/processing.py (hỗ trợ tương thích ngược)."""
    processed_image, _ = process_image_operation_with_metadata(image, params)
    return processed_image
