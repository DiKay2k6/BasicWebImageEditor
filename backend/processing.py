"""Module chứa các hàm xử lý ảnh bằng OpenCV phục vụ cho Web Image Editor."""

from typing import Optional, Tuple

import cv2
import numpy as np


# ==========================================
# 1. FILTERING (Lọc ảnh & Điều chỉnh màu sắc)
# ==========================================


def apply_grayscale(image: Optional[np.ndarray]) -> Optional[np.ndarray]:
    """Chuyển ảnh BGR sang ảnh xám (Grayscale)."""
    if image is None:
        return None
    if len(image.shape) == 2:
        return image
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def apply_blur(
    image: Optional[np.ndarray], kernel_size: Tuple[int, int] = (15, 15)
) -> Optional[np.ndarray]:
    """Áp dụng bộ lọc làm mờ Gaussian Blur lên ảnh."""
    if image is None:
        return None
    return cv2.GaussianBlur(image, kernel_size, 0)


def adjust_brightness(
    image: Optional[np.ndarray], value: int | float
) -> Optional[np.ndarray]:
    """Điều chỉnh độ sáng của ảnh bằng cv2.convertScaleAbs (beta=value)."""
    if image is None:
        return None
    return cv2.convertScaleAbs(image, alpha=1.0, beta=value)


def adjust_contrast(
    image: Optional[np.ndarray], alpha: float
) -> Optional[np.ndarray]:
    """Điều chỉnh độ tương phản của ảnh bằng cv2.convertScaleAbs (alpha=alpha)."""
    if image is None:
        return None
    return cv2.convertScaleAbs(image, alpha=alpha, beta=0)


def apply_sharpen(image: Optional[np.ndarray]) -> Optional[np.ndarray]:
    """Làm sắc nét ảnh bằng ma trận tích chập (convolution kernel)."""
    if image is None:
        return None
    kernel = np.array(
        [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
        ],
        dtype=np.float32,
    )
    return cv2.filter2D(image, -1, kernel)


def apply_edge_detection(
    image: Optional[np.ndarray],
    low_threshold: int = 100,
    high_threshold: int = 200,
) -> Optional[np.ndarray]:
    """Phát hiện cạnh trong ảnh bằng thuật toán Canny Edge Detection."""
    if image is None:
        return None
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    return cv2.Canny(blurred, low_threshold, high_threshold)


# ==========================================
# 2. TRANSFORMING (Biến đổi hình học ảnh)
# ==========================================


def resize_image(
    image: Optional[np.ndarray], width: int, height: int
) -> Optional[np.ndarray]:
    """Thay đổi kích thước ảnh theo chiều rộng (width) và chiều cao (height)."""
    if image is None:
        return None
    return cv2.resize(image, (width, height))


def rotate_image(image: Optional[np.ndarray], angle: int) -> Optional[np.ndarray]:
    """Xoay ảnh theo các góc 90, 180 hoặc 270 (-90) độ."""
    if image is None:
        return None

    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    if angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)
    if angle in (270, -90):
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    return image


def flip_image(image: Optional[np.ndarray], direction: str) -> Optional[np.ndarray]:
    """Lật ảnh theo chiều ngang ('horizontal'), dọc ('vertical') hoặc cả hai ('both')."""
    if image is None:
        return None

    if direction == "horizontal":
        return cv2.flip(image, 1)
    if direction == "vertical":
        return cv2.flip(image, 0)
    if direction == "both":
        return cv2.flip(image, -1)
    return image


def crop_image(
    image: Optional[np.ndarray],
    x: Optional[int] = None,
    y: Optional[int] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> Optional[np.ndarray]:
    """Cắt ảnh tự do bằng OpenCV theo tọa độ vùng chọn (x, y, width, height)."""
    if image is None:
        return None

    if x is None or y is None or width is None or height is None:
        return None

    img_h, img_w = image.shape[:2]
    if img_h <= 0 or img_w <= 0:
        return None

    start_x = int(x)
    start_y = int(y)
    req_w = int(width)
    req_h = int(height)

    if start_x < 0 or start_y < 0 or start_x >= img_w or start_y >= img_h:
        return None
    if req_w < 4 or req_h < 4:
        return None

    crop_w = min(req_w, img_w - start_x)
    crop_h = min(req_h, img_h - start_y)

    if crop_w < 4 or crop_h < 4:
        return None

    return image[start_y : start_y + crop_h, start_x : start_x + crop_w]
