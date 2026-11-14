// ==========================================
// COMPARE ORIGINAL / CURRENT & DOWNLOAD IMAGE
// ==========================================

import {
    uploadState,
    uiState
} from './state.js';
import { showNotification } from './notifications.js';
import { updateCropOverlayVisibility } from './crop.js';
import { buildEditedFileName, triggerDownload } from './file-utils.js';

function getOriginalBadge(previewContainer) {
    let badge = document.getElementById('original-badge');
    if (!badge && previewContainer) {
        badge = document.createElement('div');
        badge.id = 'original-badge';
        badge.className = 'absolute top-4 right-4 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded shadow-lg font-medium tracking-wide z-20';
        badge.textContent = 'Bản gốc';
        previewContainer.appendChild(badge);
    }
    return badge;
}

export function initCompareAndDownload() {
    const btnCompare = document.getElementById('btn-compare');
    const btnDownload = document.getElementById('btn-download');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    function setComparing(isComparing) {
        uiState.isComparing = isComparing;
        updateCropOverlayVisibility();

        if (btnCompare) {
            btnCompare.classList.toggle('text-blue-400', isComparing);
            btnCompare.classList.toggle('text-gray-400', !isComparing);
        }
        const badge = getOriginalBadge(previewContainer);
        if (badge) badge.classList.toggle('hidden', !isComparing);

        if (imagePreview) {
            imagePreview.src = isComparing
                ? uploadState.previewUrl
                : (uploadState.currentProcessedUrl || uploadState.previewUrl);
        }
    }

    function showOriginal() {
        if (!uploadState.previewUrl) {
            showNotification('Vui lòng tải ảnh lên trước khi so sánh!', 'warning');
            return;
        }
        if (!uploadState.currentProcessedUrl) {
            showNotification('Ảnh chưa có chỉnh sửa nào để so sánh với bản gốc.', 'info');
            return;
        }
        setComparing(true);
    }

    function hideOriginal() {
        if (uiState.isComparing) setComparing(false);
    }

    if (btnCompare) {
        btnCompare.addEventListener('mousedown', (e) => {
            if (e.button === 0) showOriginal();
        });
        btnCompare.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showOriginal();
        });
        // Nhấn giữ phím Space/Enter trên nút cũng xem được bản gốc
        btnCompare.addEventListener('keydown', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                e.preventDefault();
                showOriginal();
            }
        });
        btnCompare.addEventListener('keyup', hideOriginal);

        // Nhả chuột/ngón tay ở bất kỳ đâu, hoặc cửa sổ mất focus → quay lại ảnh đã chỉnh sửa
        document.addEventListener('mouseup', hideOriginal);
        document.addEventListener('touchend', hideOriginal);
        document.addEventListener('touchcancel', hideOriginal);
        window.addEventListener('blur', hideOriginal);
    }

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            if (!uploadState.previewUrl) {
                showNotification('Vui lòng tải ảnh lên trước khi tải xuống!', 'warning');
                return;
            }
            if (uiState.isProcessing) {
                showNotification('Ảnh đang được xử lý, vui lòng đợi hoàn tất rồi tải xuống.', 'warning');
                return;
            }

            const hasEdits = Boolean(uploadState.currentProcessedUrl);
            const href = uploadState.currentProcessedUrl || uploadState.previewUrl;
            const mimeType = hasEdits ? uploadState.currentProcessedType : uploadState.fileType;
            const fileName = buildEditedFileName(uploadState.fileName, mimeType);

            triggerDownload(href, fileName);
            showNotification(
                hasEdits ? `Đã tải xuống ${fileName}` : `Ảnh chưa chỉnh sửa - đã tải xuống bản gốc (${fileName}).`,
                hasEdits ? 'success' : 'info'
            );
        });
    }
}
