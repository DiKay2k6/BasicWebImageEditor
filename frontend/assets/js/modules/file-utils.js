// ==========================================
// FILE HELPERS - đặt tên & tải file xuống
// ==========================================

const EXTENSION_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg' };

/** Tạo tên file '<tên gốc>_edited.<đuôi>' với đuôi khớp định dạng thực tế của ảnh (mimeType). */
export function buildEditedFileName(originalName, mimeType) {
    const name = String(originalName || 'image');
    const dotIndex = name.lastIndexOf('.');
    const baseName = (dotIndex > 0 ? name.slice(0, dotIndex) : name) || 'image';
    const originalExt = dotIndex > 0 ? name.slice(dotIndex + 1).toLowerCase() : 'jpg';
    const ext = EXTENSION_BY_MIME[mimeType] || originalExt;
    return `${baseName}_edited.${ext}`;
}

export function triggerDownload(href, filename) {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    // Trì hoãn thu hồi để trình duyệt kịp bắt đầu tải
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
