// ==========================================
// COMPARE ORIGINAL / CURRENT & DOWNLOAD IMAGE
// ==========================================

import {
    uploadState,
    uiState
} from './state.js';
import { showNotification } from './notifications.js';
import { updateCropOverlayVisibility } from './crop.js';

export function initCompareAndDownload() {
    const btnCompare = document.getElementById('btn-compare');
    const btnDownload = document.getElementById('btn-download');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    function showOriginal() {
        if (!uploadState.previewUrl) return;
        uiState.isComparing = true;
        updateCropOverlayVisibility();

        if (btnCompare) {
            btnCompare.classList.add('text-blue-400');
            btnCompare.classList.remove('text-gray-400');
        }

        let badge = document.getElementById('original-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'original-badge';
            badge.className = 'absolute top-4 right-4 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded shadow-lg font-medium tracking-wide z-20';
            badge.textContent = 'Bản gốc';
            if (previewContainer) {
                previewContainer.appendChild(badge);
            }
        }
        if (badge) badge.classList.remove('hidden');

        if (imagePreview) {
            imagePreview.src = uploadState.previewUrl;
        }
    }

    function hideOriginal() {
        if (!uploadState.previewUrl) return;
        uiState.isComparing = false;
        updateCropOverlayVisibility();

        if (btnCompare) {
            btnCompare.classList.remove('text-blue-400');
            btnCompare.classList.add('text-gray-400');
        }

        const badge = document.getElementById('original-badge');
        if (badge) {
            badge.classList.add('hidden');
        }

        if (imagePreview) {
            imagePreview.src = uploadState.currentProcessedUrl || uploadState.previewUrl;
        }
    }

    if (btnCompare) {
        btnCompare.addEventListener('mousedown', (e) => {
            if (e.button === 0) showOriginal();
        });
        document.addEventListener('mouseup', () => {
            if (uiState.isComparing) hideOriginal();
        });

        btnCompare.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showOriginal();
        });
        document.addEventListener('touchend', () => {
            if (uiState.isComparing) hideOriginal();
        });
    }

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            if (!uploadState.previewUrl) {
                showNotification('Vui lòng tải ảnh lên trước khi tải xuống!', 'warning');
                return;
            }

            const a = document.createElement('a');
            a.href = uploadState.currentProcessedUrl || uploadState.previewUrl;

            let downloadName = 'edited-image.jpg';
            if (uploadState.fileName) {
                const parts = uploadState.fileName.split('.');
                const ext = parts.length > 1 ? parts.pop() : 'jpg';
                const baseName = parts.length > 0 ? parts.join('.') : 'image';
                downloadName = `${baseName}_edited.${ext}`;
            }

            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
}
