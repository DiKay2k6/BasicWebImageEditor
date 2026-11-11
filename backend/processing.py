import os
import threading
from typing import Optional, Tuple

import cv2
import numpy as np


# 1. FILTERING (Lọc ảnh & Điều chỉnh màu sắc)
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


# 2. TRANSFORMING (Biến đổi hình học ảnh)
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


# 3. FACE DETECTION & BLURRING (Nhận diện và làm mờ khuôn mặt)
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_YUNET_MODEL_PATH = os.path.join(
    _CURRENT_DIR, "models", "face_detection_yunet_2023mar.onnx"
)
_CASCADES_DIR = os.path.join(_CURRENT_DIR, "cascades")

_MAX_DETECT_DIM = 1024
_DEFAULT_CONF_THRESHOLD = 0.70
_ROTATED_CONF_THRESHOLD = 0.82
_MIN_FACE_SIZE = 20

_detector_lock = threading.Lock()
_yunet_detector = None
_cascade_detector = None
_last_detect_cache: tuple[Optional[tuple], list[tuple[int, int, int, int]]] = (None, [])


def _to_bgr(image: np.ndarray) -> np.ndarray:
    """Chuẩn hóa ảnh đầu vào (Grayscale, BGRA hoặc BGR) về chuẩn 3 kênh màu BGR."""
    if len(image.shape) == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    if image.shape[2] == 4:
        return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    return image


def _enhance_low_light(bgr_img: np.ndarray) -> np.ndarray:
    """Cân bằng sáng cục bộ trên kênh L (hệ màu LAB) giúp giữ nguyên màu da tự nhiên."""
    lab = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)
    return cv2.cvtColor(cv2.merge((enhanced_l, a_channel, b_channel)), cv2.COLOR_LAB2BGR)


def _is_valid_face_box(w: int, h: int) -> bool:
    """Kiểm tra kích thước tối thiểu và tỉ lệ khung hình hợp lý của khuôn mặt."""
    if w < _MIN_FACE_SIZE or h < _MIN_FACE_SIZE:
        return False
    aspect_ratio = w / float(h)
    return 0.55 <= aspect_ratio <= 1.75


def _get_yunet_detector(width: int, height: int, conf_threshold: float):
    """Khởi tạo một lần (Singleton) và cập nhật cấu hình cho bộ nhận diện YuNet."""
    global _yunet_detector
    if not hasattr(cv2, "FaceDetectorYN_create") or not os.path.isfile(_YUNET_MODEL_PATH):
        return None

    if _yunet_detector is None:
        _yunet_detector = cv2.FaceDetectorYN_create(
            model=_YUNET_MODEL_PATH,
            config="",
            input_size=(width, height),
            score_threshold=conf_threshold,
            nms_threshold=0.3,
            top_k=500,
        )
    else:
        _yunet_detector.setInputSize((width, height))
        _yunet_detector.setScoreThreshold(conf_threshold)
    return _yunet_detector


def _unrotate_box(
    rx: float, ry: float, fw: float, fh: float, angle: int, w: int, h: int
) -> tuple[float, float, float, float]:
    """Chuyển tọa độ khuôn mặt từ ảnh đã xoay (90, 180, 270 độ) về hệ tọa độ ảnh gốc."""
    if angle == 90:
        return ry, h - (rx + fw), fh, fw
    if angle == 180:
        return w - (rx + fw), h - (ry + fh), fw, fh
    if angle == 270:
        return w - (ry + fh), rx, fh, fw
    return rx, ry, fw, fh


def _is_overlapping_face(
    box_a: tuple[int, int, int, int], box_b: tuple[int, int, int, int]
) -> bool:
    """Kiểm tra 2 khung có trùng vào cùng một khuôn mặt hay không (dựa trên tỷ lệ diện tích giao & tâm)."""
    ax, ay, aw, ah = box_a
    bx, by, bw, bh = box_b

    # 1. Nếu diện tích phần giao chiếm >= 35% diện tích của khung nhỏ hơn -> trùng 1 khuôn mặt
    inter_w = max(0, min(ax + aw, bx + bw) - max(ax, bx))
    inter_h = max(0, min(ay + ah, by + bh) - max(ay, by))
    inter_area = inter_w * inter_h
    min_area = float(min(aw * ah, bw * bh))
    if min_area > 0 and (inter_area / min_area) >= 0.35:
        return True

    # 2. Nếu tâm của 2 khung nằm quá gần nhau (< 55% kích thước khung) -> trùng 1 khuôn mặt
    acx, acy = ax + aw * 0.5, ay + ah * 0.5
    bcx, bcy = bx + bw * 0.5, by + bh * 0.5
    dist = ((acx - bcx) ** 2 + (acy - bcy) ** 2) ** 0.5
    return dist < min(max(aw, ah), max(bw, bh)) * 0.55


def _deduplicate_boxes(
    candidates: list[tuple[float, tuple[int, int, int, int]]]
) -> list[tuple[int, int, int, int]]:
    """Sắp xếp theo độ tin cậy giảm dần và lọc bỏ các khung trùng lặp trên cùng một khuôn mặt."""
    accepted: list[tuple[int, int, int, int]] = []
    for _, box in sorted(candidates, key=lambda item: item[0], reverse=True):
        if not any(_is_overlapping_face(box, existing) for existing in accepted):
            accepted.append(box)
    return accepted


def _scale_and_clamp_box(
    x: float, y: float, w: float, h: float, inv_scale: float, img_w: int, img_h: int
) -> Optional[tuple[int, int, int, int]]:
    """Quy đổi tọa độ về kích thước ảnh gốc và kiểm tra tính hợp lệ."""
    fx = max(0, min(int(round(x * inv_scale)), img_w - 1))
    fy = max(0, min(int(round(y * inv_scale)), img_h - 1))
    fw = max(1, min(int(round(w * inv_scale)), img_w - fx))
    fh = max(1, min(int(round(h * inv_scale)), img_h - fy))
    return (fx, fy, fw, fh) if _is_valid_face_box(fw, fh) else None


def _detect_with_yunet(
    bgr_img: np.ndarray, conf_threshold: float
) -> Optional[list[tuple[int, int, int, int]]]:
    """Chạy mô hình AI YuNet đa góc nhìn (0°, 90°, 180°, 270°) để bắt đủ mặt xoay nghiêng/ngược."""
    img_h, img_w = bgr_img.shape[:2]

    # Thu nhỏ ảnh lớn về tối đa 1024px để tăng tốc và giữ chuẩn tỉ lệ Anchor Box của YuNet
    scale = min(1.0, _MAX_DETECT_DIM / float(max(img_w, img_h)))
    if scale < 1.0:
        det_w = max(16, int(round(img_w * scale)))
        det_h = max(16, int(round(img_h * scale)))
        det_img = cv2.resize(bgr_img, (det_w, det_h), interpolation=cv2.INTER_AREA)
    else:
        det_w, det_h = max(16, img_w), max(16, img_h)
        det_img = bgr_img

    inv_scale = 1.0 / scale
    rot_thresh = max(_ROTATED_CONF_THRESHOLD, conf_threshold)
    rotations = (
        (0, det_img, conf_threshold),
        (90, cv2.rotate(det_img, cv2.ROTATE_90_CLOCKWISE), rot_thresh),
        (180, cv2.rotate(det_img, cv2.ROTATE_180), rot_thresh),
        (270, cv2.rotate(det_img, cv2.ROTATE_90_COUNTERCLOCKWISE), rot_thresh),
    )

    candidates: list[tuple[float, tuple[int, int, int, int]]] = []

    with _detector_lock:
        for angle, rot_img, thresh in rotations:
            rh, rw = rot_img.shape[:2]
            detector = _get_yunet_detector(rw, rh, thresh)
            if detector is None:
                return None

            _, raw_faces = detector.detect(rot_img)
            if raw_faces is None:
                continue

            for face in raw_faces:
                ux, uy, uw, uh = _unrotate_box(
                    float(face[0]),
                    float(face[1]),
                    float(face[2]),
                    float(face[3]),
                    angle,
                    det_w,
                    det_h,
                )
                box = _scale_and_clamp_box(ux, uy, uw, uh, inv_scale, img_w, img_h)
                if box is not None:
                    candidates.append((float(face[-1]), box))

        # Nếu ảnh quá tối/ngược sáng chưa tìm thấy mặt nào, thử cân bằng sáng LAB
        if not candidates:
            detector = _get_yunet_detector(
                det_w, det_h, max(0.60, conf_threshold - 0.05)
            )
            if detector is not None:
                _, raw_faces = detector.detect(_enhance_low_light(det_img))
                if raw_faces is not None:
                    for face in raw_faces:
                        box = _scale_and_clamp_box(
                            float(face[0]),
                            float(face[1]),
                            float(face[2]),
                            float(face[3]),
                            inv_scale,
                            img_w,
                            img_h,
                        )
                        if box is not None:
                            candidates.append((float(face[-1]), box))

    return _deduplicate_boxes(candidates)


def _detect_with_cascade(bgr_img: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Phương pháp dự phòng bằng Haar Cascade (chỉ gọi khi không có mô hình YuNet)."""
    global _cascade_detector
    if not hasattr(cv2, "CascadeClassifier"):
        return []

    with _detector_lock:
        if _cascade_detector is None:
            xml_path = os.path.join(_CASCADES_DIR, "haarcascade_frontalface_default.xml")
            if not os.path.isfile(xml_path) and hasattr(cv2, "data"):
                xml_path = os.path.join(
                    cv2.data.haarcascades, "haarcascade_frontalface_default.xml"
                )
            if not os.path.isfile(xml_path):
                return []
            _cascade_detector = cv2.CascadeClassifier(xml_path)

        if _cascade_detector.empty():
            return []

        gray_img = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
        rects = _cascade_detector.detectMultiScale(
            gray_img, scaleFactor=1.1, minNeighbors=6, minSize=(30, 30)
        )
        return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in rects]


def detect_faces(
    image: Optional[np.ndarray], conf_threshold: float = _DEFAULT_CONF_THRESHOLD
) -> list[tuple[int, int, int, int]]:
    """Phát hiện khuôn mặt trong ảnh và trả về danh sách tọa độ [(x, y, w, h), ...]."""
    global _last_detect_cache
    if image is None or image.size == 0:
        return []

    img_h, img_w = image.shape[:2]
    if img_h < _MIN_FACE_SIZE or img_w < _MIN_FACE_SIZE:
        return []

    # Kiểm tra cache để tránh chạy lại AI khi người dùng chỉ kéo thanh trượt độ mờ
    cache_key = (image.shape, hash(image.tobytes()), round(float(conf_threshold), 2))
    cached_key, cached_faces = _last_detect_cache
    if cache_key == cached_key:
        return list(cached_faces)

    bgr_img = _to_bgr(image)
    faces = _detect_with_yunet(bgr_img, float(conf_threshold))
    if faces is None:
        faces = _detect_with_cascade(bgr_img)

    _last_detect_cache = (cache_key, faces)
    return list(faces)


def blur_faces(
    image: Optional[np.ndarray],
    faces: Optional[list[tuple[int, int, int, int]]] = None,
    blur_strength: int = 30,
    blur_type: str = "gaussian",
) -> Optional[np.ndarray]:
    """Làm mờ các vùng khuôn mặt trên ảnh theo kiểu 'gaussian' hoặc 'pixelate'."""
    if image is None:
        return None

    if faces is None:
        faces = detect_faces(image)

    result = image.copy()
    if not faces:
        return result

    img_h, img_w = result.shape[:2]
    strength = max(1, min(100, int(blur_strength)))
    is_pixelate = str(blur_type).strip().lower() == "pixelate"

    for (x, y, w, h) in faces:
        # Mở rộng vùng làm mờ thêm 10% để che kín trán và cằm
        pad_x, pad_y = int(w * 0.1), int(h * 0.1)
        x1, y1 = max(0, x - pad_x), max(0, y - pad_y)
        x2, y2 = min(img_w, x + w + pad_x), min(img_h, y + h + pad_y)

        roi_w, roi_h = x2 - x1, y2 - y1
        if roi_w <= 2 or roi_h <= 2:
            continue

        roi = result[y1:y2, x1:x2]
        if is_pixelate:
            scale = max(0.02, min(0.4, 0.45 - (strength / 100.0) * 0.42))
            small_w = max(1, int(roi_w * scale))
            small_h = max(1, int(roi_h * scale))
            small = cv2.resize(roi, (small_w, small_h), interpolation=cv2.INTER_LINEAR)
            result[y1:y2, x1:x2] = cv2.resize(
                small, (roi_w, roi_h), interpolation=cv2.INTER_NEAREST
            )
        else:
            k = max(7, int(min(roi_w, roi_h) * (strength / 40.0)))
            if k % 2 == 0:
                k += 1
            result[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (k, k), 0)

    return result


def draw_face_boxes(
    image: Optional[np.ndarray],
    faces: Optional[list[tuple[int, int, int, int]]] = None,
    color: tuple[int, int, int] = (0, 215, 255),
    thickness: int = 2,
) -> Optional[np.ndarray]:
    """Vẽ khung chữ nhật và số thứ tự nhận diện khuôn mặt trực quan lên ảnh."""
    if image is None:
        return None

    if faces is None:
        faces = detect_faces(image)

    if not faces:
        return image.copy()

    # Đảm bảo ảnh có 3 kênh màu để khung nhận diện luôn hiển thị đúng màu sắc
    result = _to_bgr(image).copy()
    img_h, img_w = result.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX

    for idx, (x, y, w, h) in enumerate(faces, 1):
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(img_w - 1, x + w), min(img_h - 1, y + h)

        cv2.rectangle(result, (x1, y1), (x2, y2), color, thickness)

        label = f"Face #{idx}"
        font_scale = max(0.4, min(0.7, w / 200.0))
        (text_w, text_h), _ = cv2.getTextSize(label, font, font_scale, 1)

        label_y = max(y1 - 6, text_h + 6)
        bg_y1 = max(0, label_y - text_h - 4)
        bg_x2 = min(img_w - 1, x1 + text_w + 6)

        cv2.rectangle(result, (x1, bg_y1), (bg_x2, label_y + 2), color, -1)
        cv2.putText(
            result,
            label,
            (x1 + 3, label_y - 2),
            font,
            font_scale,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

    return result

