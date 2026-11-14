class ApiError(Exception):
    """Lỗi nghiệp vụ trả về cho Frontend dưới dạng JSON {"error": message}."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
