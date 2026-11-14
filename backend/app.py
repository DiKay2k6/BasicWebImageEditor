import os
from typing import Any, Dict, Optional, Tuple

from flask import Flask, Response, jsonify, send_from_directory
from pymongo.errors import PyMongoError
from werkzeug.exceptions import HTTPException

from auth_routes import auth_bp
from config import FRONTEND_DIR, load_config
from errors import ApiError
from history_routes import history_bp
from image_routes import image_bp
from profile_routes import profile_bp

DB_UNAVAILABLE_MESSAGE = (
    "Không thể kết nối cơ sở dữ liệu MongoDB. Vui lòng kiểm tra dịch vụ MongoDB đã chạy chưa."
)
HTTP_ERROR_MESSAGES = {
    404: "Không tìm thấy tài nguyên yêu cầu.",
    405: "Phương thức HTTP không được hỗ trợ cho đường dẫn này.",
    413: "Kích thước file ảnh quá lớn (tối đa 20MB).",
}


def _error_response(message: str, status_code: int) -> Tuple[Response, int]:
    return jsonify({"error": message}), status_code


def _register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError) -> Tuple[Response, int]:
        return _error_response(err.message, err.status_code)

    @app.errorhandler(PyMongoError)
    def handle_database_error(err: PyMongoError) -> Tuple[Response, int]:
        app.logger.error("MongoDB error: %s", err)
        return _error_response(DB_UNAVAILABLE_MESSAGE, 503)

    @app.errorhandler(HTTPException)
    def handle_http_error(err: HTTPException) -> Tuple[Response, int]:
        code = err.code or 500
        return _error_response(HTTP_ERROR_MESSAGES.get(code, err.description), code)

    @app.errorhandler(Exception)
    def handle_unexpected_error(err: Exception) -> Tuple[Response, int]:
        app.logger.exception("Unhandled error: %s", err)
        return _error_response("Đã xảy ra lỗi phía máy chủ. Vui lòng thử lại.", 500)


def _register_frontend_routes(app: Flask) -> None:
    @app.get("/")
    def serve_index() -> Response:
        """Phục vụ trang giao diện chính của Web Image Editor."""
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def serve_static_files(asset_path: str) -> Response:
        """Phục vụ các tài nguyên tĩnh (CSS, JS, HTML pages, images) của Frontend."""
        return send_from_directory(FRONTEND_DIR, asset_path)


def create_app(config_overrides: Optional[Dict[str, Any]] = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.from_mapping(load_config())
    if config_overrides:
        app.config.update(config_overrides)

    @app.after_request
    def add_cors_headers(response: Response) -> Response:
        """CORS cho phép chạy Frontend qua Live Server; xác thực bằng header Authorization (không dùng cookie)."""
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Expose-Headers"] = (
            "X-Image-Width, X-Image-Height, X-Faces-Detected"
        )
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        return response

    for blueprint in (image_bp, auth_bp, profile_bp, history_bp):
        app.register_blueprint(blueprint)
    _register_frontend_routes(app)
    _register_error_handlers(app)
    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5055))
    app.run(host="0.0.0.0", port=port, debug=False)
