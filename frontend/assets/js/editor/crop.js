// ==========================================
// INTERACTIVE FREE CROP OVERLAY
// ==========================================

import {
    uploadState,
    cropState,
    cropBoxNorm,
    uiState,
    toggleFilterButton
} from './state.js';

export function getDisplayedImageMetrics() {
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    if (!previewContainer || !imagePreview || !uploadState.file) return null;

    const containerRect = previewContainer.getBoundingClientRect();
    const imgRect = imagePreview.getBoundingClientRect();
    if (imgRect.width <= 0 || imgRect.height <= 0) return null;

    const natW = imagePreview.naturalWidth || uploadState.currentWidth || 1;
    const natH = imagePreview.naturalHeight || uploadState.currentHeight || 1;

    const scale = Math.min(imgRect.width / natW, imgRect.height / natH);
    const dispW = natW * scale;
    const dispH = natH * scale;
    const offsetX = (imgRect.left - containerRect.left) + (imgRect.width - dispW) / 2;
    const offsetY = (imgRect.top - containerRect.top) + (imgRect.height - dispH) / 2;

    return {
        containerRect,
        offsetX,
        offsetY,
        dispW,
        dispH,
        natW,
        natH
    };
}

export function getActualCropCoords() {
    if (!cropBoxNorm.active || !uploadState.file) return null;
    const imagePreview = document.getElementById('image-preview');
    const natW = (imagePreview && imagePreview.naturalWidth) || uploadState.currentWidth || 1;
    const natH = (imagePreview && imagePreview.naturalHeight) || uploadState.currentHeight || 1;

    const x = Math.max(0, Math.min(natW - 1, Math.round(cropBoxNorm.x * natW)));
    const y = Math.max(0, Math.min(natH - 1, Math.round(cropBoxNorm.y * natH)));
    const w = Math.max(1, Math.min(natW - x, Math.round(cropBoxNorm.w * natW)));
    const h = Math.max(1, Math.min(natH - y, Math.round(cropBoxNorm.h * natH)));

    return { x, y, width: w, height: h, ref_w: natW, ref_h: natH };
}

export function renderCropSelectionBox() {
    const cropSelectionBox = document.getElementById('crop-selection-box');
    const cropSizeBadge = document.getElementById('crop-size-badge');

    if (!cropSelectionBox) return;

    if (!cropBoxNorm.active || !uploadState.file || !cropState.isCropModeActive || uiState.isComparing) {
        cropSelectionBox.classList.add('hidden');
        return;
    }

    const metrics = getDisplayedImageMetrics();
    if (!metrics) {
        cropSelectionBox.classList.add('hidden');
        return;
    }

    const leftPx = metrics.offsetX + cropBoxNorm.x * metrics.dispW;
    const topPx = metrics.offsetY + cropBoxNorm.y * metrics.dispH;
    const widthPx = Math.max(8, cropBoxNorm.w * metrics.dispW);
    const heightPx = Math.max(8, cropBoxNorm.h * metrics.dispH);

    cropSelectionBox.style.left = `${leftPx}px`;
    cropSelectionBox.style.top = `${topPx}px`;
    cropSelectionBox.style.width = `${widthPx}px`;
    cropSelectionBox.style.height = `${heightPx}px`;
    cropSelectionBox.classList.remove('hidden');

    const actual = getActualCropCoords();
    if (cropSizeBadge && actual) {
        cropSizeBadge.textContent = `${actual.width} × ${actual.height} px`;
    }
}

export function setDefaultCenteredCropBox() {
    if (!uploadState.file) {
        cropBoxNorm.active = false;
        renderCropSelectionBox();
        return;
    }

    cropBoxNorm.x = 0.1;
    cropBoxNorm.y = 0.1;
    cropBoxNorm.w = 0.8;
    cropBoxNorm.h = 0.8;
    cropBoxNorm.active = true;

    renderCropSelectionBox();
}

export function updateCropOverlayVisibility() {
    const cropOverlay = document.getElementById('crop-overlay');
    const cropHintText = document.getElementById('crop-hint');
    const btnApplyCrop = document.getElementById('btn-apply-crop');

    if (!cropOverlay) return;
    const isCropActiveInTransform = (
        uiState.activeTab === 'transform' &&
        Boolean(uploadState.file) &&
        cropState.isCropModeActive
    );

    if (btnApplyCrop) {
        btnApplyCrop.classList.toggle('hidden', !isCropActiveInTransform);
    }
    if (cropHintText) {
        cropHintText.classList.toggle('hidden', !isCropActiveInTransform);
    }

    const shouldShowOverlay = isCropActiveInTransform && !uiState.isComparing;
    cropOverlay.classList.toggle('hidden', !shouldShowOverlay);

    if (shouldShowOverlay && !cropBoxNorm.active) {
        setDefaultCenteredCropBox();
    } else {
        renderCropSelectionBox();
    }
}

export function setCropMode(enabled) {
    const btnCropToggle = document.getElementById('btn-crop-toggle');
    cropState.isCropModeActive = Boolean(enabled);

    if (btnCropToggle) {
        toggleFilterButton(btnCropToggle, cropState.isCropModeActive);
        btnCropToggle.innerHTML = cropState.isCropModeActive
            ? '<i class="fas fa-crop-alt mr-2"></i> Tắt khung cắt'
            : '<i class="fas fa-crop-alt mr-2"></i> Chọn vùng cắt';
    }

    if (cropState.isCropModeActive && uploadState.file) {
        setDefaultCenteredCropBox();
    } else {
        cropBoxNorm.active = false;
    }
    updateCropOverlayVisibility();
}

export function initCrop({ onToggleCropWithoutImage, onApplyCrop }) {
    const imagePreview = document.getElementById('image-preview');
    const cropOverlay = document.getElementById('crop-overlay');
    const btnCropToggle = document.getElementById('btn-crop-toggle');
    const btnApplyCrop = document.getElementById('btn-apply-crop');

    if (imagePreview) {
        imagePreview.addEventListener('load', () => {
            if (cropState.isCropModeActive && cropBoxNorm.active) {
                renderCropSelectionBox();
            }
        });
    }

    window.addEventListener('resize', () => {
        if (cropState.isCropModeActive && cropBoxNorm.active) {
            renderCropSelectionBox();
        }
    });

    if (btnCropToggle) {
        btnCropToggle.addEventListener('click', () => {
            if (!uploadState.file) {
                if (onToggleCropWithoutImage) onToggleCropWithoutImage();
                return;
            }
            setCropMode(!cropState.isCropModeActive);
        });
    }

    if (btnApplyCrop) {
        btnApplyCrop.addEventListener('click', () => {
            if (onApplyCrop) onApplyCrop();
        });
    }

    const MIN_NORM_SIZE = 0.03;
    let cropInteraction = null;

    function getImageNormCoordsFromClient(clientX, clientY, metrics) {
        const relX = (clientX - metrics.containerRect.left - metrics.offsetX) / metrics.dispW;
        const relY = (clientY - metrics.containerRect.top - metrics.offsetY) / metrics.dispH;
        return {
            x: Math.max(0, Math.min(1, relX)),
            y: Math.max(0, Math.min(1, relY))
        };
    }

    if (cropOverlay) {
        cropOverlay.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || !uploadState.file || !cropState.isCropModeActive || uiState.isComparing) return;
            const metrics = getDisplayedImageMetrics();
            if (!metrics) return;

            e.preventDefault();
            e.stopPropagation();

            const handleEl = e.target.closest('.crop-handle');
            const insideSelection = e.target.closest('#crop-selection-box');
            const pt = getImageNormCoordsFromClient(e.clientX, e.clientY, metrics);

            if (handleEl && cropBoxNorm.active) {
                cropInteraction = {
                    mode: 'resize',
                    dir: handleEl.getAttribute('data-handle') || 'se',
                    startMouseX: pt.x,
                    startMouseY: pt.y,
                    startBox: { ...cropBoxNorm },
                    metrics
                };
            } else if (insideSelection && cropBoxNorm.active) {
                cropInteraction = {
                    mode: 'move',
                    startMouseX: pt.x,
                    startMouseY: pt.y,
                    startBox: { ...cropBoxNorm },
                    metrics
                };
            } else {
                cropBoxNorm.active = true;
                cropBoxNorm.x = pt.x;
                cropBoxNorm.y = pt.y;
                cropBoxNorm.w = MIN_NORM_SIZE;
                cropBoxNorm.h = MIN_NORM_SIZE;
                cropInteraction = {
                    mode: 'create',
                    startMouseX: pt.x,
                    startMouseY: pt.y,
                    startBox: { ...cropBoxNorm },
                    metrics
                };
                renderCropSelectionBox();
            }
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!cropInteraction) return;
        const { mode, dir, startMouseX, startMouseY, startBox, metrics } = cropInteraction;
        const pt = getImageNormCoordsFromClient(e.clientX, e.clientY, metrics);
        const dx = pt.x - startMouseX;
        const dy = pt.y - startMouseY;

        if (mode === 'move') {
            const newX = Math.max(0, Math.min(1 - startBox.w, startBox.x + dx));
            const newY = Math.max(0, Math.min(1 - startBox.h, startBox.y + dy));
            cropBoxNorm.x = newX;
            cropBoxNorm.y = newY;
            cropBoxNorm.w = startBox.w;
            cropBoxNorm.h = startBox.h;
            renderCropSelectionBox();
            return;
        }

        if (mode === 'create') {
            const x1 = Math.max(0, Math.min(startMouseX, pt.x));
            const y1 = Math.max(0, Math.min(startMouseY, pt.y));
            const x2 = Math.min(1, Math.max(startMouseX, pt.x));
            const y2 = Math.min(1, Math.max(startMouseY, pt.y));

            cropBoxNorm.x = x1;
            cropBoxNorm.y = y1;
            cropBoxNorm.w = Math.max(MIN_NORM_SIZE, Math.min(1 - x1, x2 - x1));
            cropBoxNorm.h = Math.max(MIN_NORM_SIZE, Math.min(1 - y1, y2 - y1));
            renderCropSelectionBox();
            return;
        }

        if (mode === 'resize') {
            let left = startBox.x;
            let top = startBox.y;
            let right = startBox.x + startBox.w;
            let bottom = startBox.y + startBox.h;

            if (dir.includes('w')) {
                left = Math.max(0, Math.min(right - MIN_NORM_SIZE, pt.x));
            }
            if (dir.includes('e')) {
                right = Math.min(1, Math.max(left + MIN_NORM_SIZE, pt.x));
            }
            if (dir.includes('n')) {
                top = Math.max(0, Math.min(bottom - MIN_NORM_SIZE, pt.y));
            }
            if (dir.includes('s')) {
                bottom = Math.min(1, Math.max(top + MIN_NORM_SIZE, pt.y));
            }

            cropBoxNorm.x = left;
            cropBoxNorm.y = top;
            cropBoxNorm.w = Math.max(MIN_NORM_SIZE, right - left);
            cropBoxNorm.h = Math.max(MIN_NORM_SIZE, bottom - top);
            renderCropSelectionBox();
        }
    });

    function finishCropInteraction() {
        if (!cropInteraction) return;
        cropInteraction = null;
        renderCropSelectionBox();
    }

    document.addEventListener('mouseup', finishCropInteraction);
    window.addEventListener('blur', finishCropInteraction);
}
