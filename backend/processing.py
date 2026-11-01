import os
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


# 3. FACE DETECTION & BLURRING (Nhận diện và làm mờ khuôn mặt - Tuần 9-10)
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_YUNET_MODEL_PATH = os.path.join(
    _CURRENT_DIR, "models", "face_detection_yunet_2023mar.onnx"
)
_CASCADES_DIR = os.path.join(_CURRENT_DIR, "cascades")

_yunet_detector = None


def _get_yunet_detector(width: int, height: int, conf_threshold: float = 0.5):
    """Khởi tạo hoặc cập nhật kích thước đầu vào cho bộ nhận diện khuôn mặt YuNet (OpenCV)."""
    global _yunet_detector
    if not hasattr(cv2, "FaceDetectorYN_create"):
        return None

    if not os.path.isfile(_YUNET_MODEL_PATH):
        return None

    try:
        if _yunet_detector is None:
            _yunet_detector = cv2.FaceDetectorYN_create(
                model=_YUNET_MODEL_PATH,
                config="",
                input_size=(max(16, width), max(16, height)),
                score_threshold=float(conf_threshold),
                nms_threshold=0.3,
                top_k=5000,
            )
        else:
            _yunet_detector.setInputSize((max(16, width), max(16, height)))
            _yunet_detector.setScoreThreshold(float(conf_threshold))
        return _yunet_detector
    except Exception:
        return None


def _detect_faces_cascade(
    gray_img: np.ndarray,
) -> list[tuple[int, int, int, int]]:
    """Phương pháp dự phòng nhận diện khuôn mặt bằng Haar Cascade (cho OpenCV 4.x)."""
    if not hasattr(cv2, "CascadeClassifier"):
        return []

    frontal_path = os.path.join(
        _CASCADES_DIR, "haarcascade_frontalface_default.xml"
    )
    if not os.path.isfile(frontal_path):
        frontal_path = getattr(cv2, "data", None) and os.path.join(
            cv2.data.haarcascades, "haarcascade_frontalface_default.xml"
        )
        if not frontal_path or not os.path.isfile(frontal_path):
            return []

    try:
        classifier = cv2.CascadeClassifier(frontal_path)
        if classifier.empty():
            return []
        rects = classifier.detectMultiScale(
            gray_img, scaleFactor=1.1, minNeighbors=5, minSize=(24, 24)
        )
        return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in rects]
    except Exception:
        return []


def detect_faces(
    image: Optional[np.ndarray], conf_threshold: float = 0.45
) -> list[tuple[int, int, int, int]]:
    """Phát hiện khuôn mặt trong ảnh bằng OpenCV (hỗ trợ 1 hoặc nhiều mặt, góc nghiêng và ánh sáng khác nhau).

    Trả về danh sách tọa độ khuôn mặt: [(x, y, w, h), ...]
    """
    if image is None:
        return []

    img_h, img_w = image.shape[:2]
    if img_h <= 0 or img_w <= 0:
        return []

    # Chuẩn hóa ảnh về định dạng BGR 3 kênh để đưa vào detector
    if len(image.shape) == 2:
        color_img = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        gray_img = image
    elif image.shape[2] == 4:
        color_img = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
        gray_img = cv2.cvtColor(color_img, cv2.COLOR_BGR2GRAY)
    else:
        color_img = image
        gray_img = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    results: list[tuple[int, int, int, int]] = []

    # 1. Thử nhận diện bằng YuNet FaceDetectorYN (chuẩn OpenCV hiện đại, chính xác cao với mọi góc nhìn & ánh sáng)
    detector = _get_yunet_detector(img_w, img_h, conf_threshold=conf_threshold)
    if detector is not None:
        try:
            _, raw_faces = detector.detect(color_img)
            if (raw_faces is None or len(raw_faces) == 0) and conf_threshold > 0.3:
                # Nếu chưa tìm thấy và ngưỡng cao, thử hạ ngưỡng nhẹ để bắt các khuôn mặt góc nghiêng / thiếu sáng
                detector.setScoreThreshold(0.3)
                _, raw_faces = detector.detect(color_img)

            if (raw_faces is None or len(raw_faces) == 0):
                # Thử cải thiện ánh sáng bằng CLAHE nếu ảnh quá tối hoặc chênh sáng mạnh
                clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
                enhanced_gray = clahe.apply(gray_img)
                enhanced_bgr = cv2.cvtColor(enhanced_gray, cv2.COLOR_GRAY2BGR)
                detector.setScoreThreshold(0.3)
                _, raw_faces = detector.detect(enhanced_bgr)

            if raw_faces is not None and len(raw_faces) > 0:
                for face in raw_faces:
                    fx, fy, fw, fh = [int(v) for v in face[0:4]]
                    # Giới hạn tọa độ trong phạm vi ảnh
                    fx = max(0, min(fx, img_w - 1))
                    fy = max(0, min(fy, img_h - 1))
                    fw = max(1, min(fw, img_w - fx))
                    fh = max(1, min(fh, img_h - fy))
                    results.append((fx, fy, fw, fh))
        except Exception:
            pass

    # 2. Nếu YuNet không khả dụng hoặc không tìm thấy khuôn mặt, dùng Haar Cascade dự phòng
    if not results:
        results = _detect_faces_cascade(gray_img)

    return results


def blur_faces(
    image: Optional[np.ndarray],
    faces: Optional[list[tuple[int, int, int, int]]] = None,
    blur_strength: int = 30,
    blur_type: str = "gaussian",
) -> Optional[np.ndarray]:
    """Làm mờ tất cả các vùng khuôn mặt được phát hiện trên ảnh bằng OpenCV.

    Tham số:
    - image: Ma trận ảnh đầu vào (BGR hoặc Grayscale).
    - faces: Danh sách tọa độ khuôn mặt (nếu None sẽ tự động gọi detect_faces).
    - blur_strength: Cường độ làm mờ từ 1 đến 100 (mặc định 30).
    - blur_type: Kiểu làm mờ ('gaussian' hoặc 'pixelate').
    """
    if image is None:
        return None

    if faces is None:
        faces = detect_faces(image)

    if not faces:
        return image.copy()

    result = image.copy()
    img_h, img_w = result.shape[:2]
    strength = max(1, min(100, int(blur_strength)))
    b_type = str(blur_type).strip().lower()

    for (x, y, w, h) in faces:
        # Thêm 10% lề (padding) xung quanh khuôn mặt để che toàn diện cằm, trán và viền mặt
        pad_x = int(w * 0.1)
        pad_y = int(h * 0.1)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(img_w, x + w + pad_x)
        y2 = min(img_h, y + h + pad_y)

        roi_w = x2 - x1
        roi_h = y2 - y1
        if roi_w <= 2 or roi_h <= 2:
            continue

        roi = result[y1:y2, x1:x2]

        if b_type == "pixelate":
            # Làm mờ dạng Pixelate / Mosaic (hiệu ứng điểm ảnh che danh tính)
            scale = max(0.02, min(0.4, 0.45 - (strength / 100.0) * 0.42))
            small_w = max(1, int(roi_w * scale))
            small_h = max(1, int(roi_h * scale))
            small = cv2.resize(roi, (small_w, small_h), interpolation=cv2.INTER_LINEAR)
            pixelated = cv2.resize(
                small, (roi_w, roi_h), interpolation=cv2.INTER_NEAREST
            )
            result[y1:y2, x1:x2] = pixelated
        else:
            # Làm mờ dạng Gaussian Blur (mặc định)
            # Tính toán kích thước kernel lẻ phù hợp với độ phân giải khuôn mặt và cường độ
            base_k = max(7, int((min(roi_w, roi_h) * (strength / 40.0))))
            kernel_size = base_k if base_k % 2 != 0 else base_k + 1
            kernel_size = max(3, kernel_size)
            blurred_roi = cv2.GaussianBlur(roi, (kernel_size, kernel_size), 0)
            result[y1:y2, x1:x2] = blurred_roi

    return result


def draw_face_boxes(
    image: Optional[np.ndarray],
    faces: Optional[list[tuple[int, int, int, int]]] = None,
    color: tuple[int, int, int] = (0, 215, 255),
    thickness: int = 2,
) -> Optional[np.ndarray]:
    """Vẽ khung chữ nhật nhận diện khuôn mặt và số thứ tự trực quan lên ảnh."""
    if image is None:
        return None

    if faces is None:
        faces = detect_faces(image)

    if not faces:
        return image.copy()

    result = image.copy()
    img_h, img_w = result.shape[:2]

    for idx, (x, y, w, h) in enumerate(faces, 1):
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(img_w - 1, x + w)
        y2 = min(img_h - 1, y + h)

        # Vẽ hình chữ nhật bo góc/viền
        cv2.rectangle(result, (x1, y1), (x2, y2), color, thickness)

        # Vẽ nhãn "Face #1", "Face #2",...
        label = f"Face #{idx}"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = max(0.4, min(0.7, w / 200.0))
        text_size, _ = cv2.getTextSize(label, font, font_scale, 1)

        label_y = max(y1 - 6, text_size[1] + 6)
        label_bg_y1 = max(0, label_y - text_size[1] - 4)
        label_bg_y2 = label_y + 2
        label_bg_x2 = min(img_w - 1, x1 + text_size[0] + 6)

        cv2.rectangle(
            result,
            (x1, label_bg_y1),
            (label_bg_x2, label_bg_y2),
            color,
            -1,
        )
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

