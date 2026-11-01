import io
import os
from typing import Any, Dict, Tuple

from flask import Flask, Response, jsonify, request, send_file, send_from_directory

from image_io import (
    ALLOWED_EXTENSIONS,
    ImageProcessingError,
    encode_image,
    validate_and_decode_image,
)
from image_service import (
    SUPPORTED_OPERATIONS,
    UNIMPLEMENTED_OPERATIONS,
    process_image_operation_with_metadata,
)
from processing import detect_faces

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # Giới hạn 20MB mỗi request


@app.after_request
def add_cors_headers(response: Response) -> Response:
    """Bổ sung CORS headers để hỗ trợ cả khi chạy Frontend cùng Flask hoặc qua Live Server."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Expose-Headers"] = (
        "X-Image-Width, X-Image-Height, X-Faces-Detected"
    )
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response


@app.route("/")
def serve_index() -> Response:
    """Phục vụ trang giao diện chính của Web Image Editor."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:AssetPath>")
def serve_static_files(AssetPath: str) -> Response:
    """Phục vụ các tài nguyên tĩnh (CSS, JS, HTML pages, images) của Frontend."""
    target_path = os.path.join(FRONTEND_DIR, AssetPath)
    if os.path.isfile(target_path):
        return send_from_directory(FRONTEND_DIR, AssetPath)
    return jsonify({"error": "Không tìm thấy tài nguyên yêu cầu."}), 404


@app.route("/api/health", methods=["GET"])
def health_check() -> Tuple[Response, int]:
    """Kiểm tra trạng thái hoạt động của Backend và danh sách thao tác hỗ trợ."""
    return (
        jsonify(
            {
                "status": "ok",
                "supported_formats": sorted(ALLOWED_EXTENSIONS),
                "supported_operations": sorted(SUPPORTED_OPERATIONS),
                "unimplemented_operations": sorted(UNIMPLEMENTED_OPERATIONS),
            }
        ),
        200,
    )


@app.route("/api/process", methods=["POST", "OPTIONS"])
def process_image() -> Tuple[Response, int] | Response:
    """Tiếp nhận ảnh và tham số từ Frontend, gọi hàm OpenCV và trả về ảnh kết quả."""
    if request.method == "OPTIONS":
        return Response(status=204)

    try:
        uploaded_file = request.files.get("image") or request.files.get("file")
        if uploaded_file is None or not uploaded_file.filename:
            raise ImageProcessingError(
                "Vui lòng tải lên một file ảnh hợp lệ (JPG, JPEG hoặc PNG)."
            )

        file_bytes = uploaded_file.read()
        image, output_ext = validate_and_decode_image(
            file_bytes=file_bytes,
            filename=uploaded_file.filename,
            content_type=uploaded_file.mimetype or "",
        )

        params: Dict[str, Any] = {}
        if request.form:
            params.update(request.form.to_dict())
        elif request.is_json:
            json_data = request.get_json(silent=True)
            if isinstance(json_data, dict):
                params.update(json_data)

        processed_image, metadata = process_image_operation_with_metadata(image, params)
        if processed_image is None:
            raise ImageProcessingError(
                "Quá trình xử lý ảnh bằng OpenCV thất bại.", status_code=500
            )

        out_h, out_w = processed_image.shape[:2]
        encoded_bytes, mimetype = encode_image(processed_image, output_ext)

        response = send_file(
            io.BytesIO(encoded_bytes),
            mimetype=mimetype,
            as_attachment=False,
            download_name=f"processed{output_ext}",
        )
        response.headers["X-Image-Width"] = str(out_w)
        response.headers["X-Image-Height"] = str(out_h)
        response.headers["X-Faces-Detected"] = str(metadata.get("faces_detected", 0))
        return response

    except ImageProcessingError as err:
        return jsonify({"error": err.message}), err.status_code
    except Exception:
        return (
            jsonify(
                {
                    "error": "Đã xảy ra lỗi phía máy chủ khi xử lý ảnh. Vui lòng thử lại."
                }
            ),
            500,
        )


@app.route("/api/detect-faces", methods=["POST", "OPTIONS"])
def detect_image_faces() -> Tuple[Response, int] | Response:
    """Phát hiện khuôn mặt trong ảnh bằng OpenCV và trả về danh sách tọa độ khuôn mặt."""
    if request.method == "OPTIONS":
        return Response(status=204)

    try:
        uploaded_file = request.files.get("image") or request.files.get("file")
        if uploaded_file is None or not uploaded_file.filename:
            raise ImageProcessingError(
                "Vui lòng tải lên một file ảnh hợp lệ (JPG, JPEG hoặc PNG)."
            )

        file_bytes = uploaded_file.read()
        image, _ = validate_and_decode_image(
            file_bytes=file_bytes,
            filename=uploaded_file.filename,
            content_type=uploaded_file.mimetype or "",
        )

        faces = detect_faces(image)
        return (
            jsonify(
                {
                    "status": "ok",
                    "faces_count": len(faces),
                    "faces": [
                        {"x": x, "y": y, "width": w, "height": h}
                        for (x, y, w, h) in faces
                    ],
                }
            ),
            200,
        )

    except ImageProcessingError as err:
        return jsonify({"error": err.message}), err.status_code
    except Exception:
        return (
            jsonify(
                {
                    "error": "Đã xảy ra lỗi phía máy chủ khi phát hiện khuôn mặt."
                }
            ),
            500,
        )


@app.errorhandler(413)
def request_entity_too_large(_error: Any) -> Tuple[Response, int]:
    """Xử lý lỗi khi kích thước file vượt quá giới hạn."""
    return (
        jsonify({"error": "Kích thước file ảnh quá lớn (tối đa 20MB)."}),
        413,
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5055))
    app.run(host="0.0.0.0", port=port, debug=False)
