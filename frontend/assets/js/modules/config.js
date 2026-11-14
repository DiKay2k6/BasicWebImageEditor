// ==========================================
// FRONTEND CONFIG
// ==========================================

// Chạy cùng Flask (cổng 5055) thì gọi API cùng origin, ngược lại (Live Server...) gọi thẳng Flask
export const API_BASE_URL = (
    window.location.protocol.startsWith('http') && window.location.port === '5055'
) ? '' : 'http://127.0.0.1:5055';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

/** Kiểm tra file ảnh phía client (khớp với quy tắc kiểm tra của Backend). Trả về thông báo lỗi hoặc ''. */
export function validateImageFile(file, maxBytes = MAX_UPLOAD_BYTES) {
    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext) || (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type))) {
        return 'File không hợp lệ! Vui lòng chọn ảnh định dạng JPG, JPEG hoặc PNG.';
    }
    if (file.size === 0) {
        return 'File ảnh rỗng hoặc không có dữ liệu.';
    }
    if (file.size > maxBytes) {
        return `Kích thước file ảnh quá lớn (tối đa ${Math.round(maxBytes / 1024 / 1024)}MB).`;
    }
    return '';
}
