// ==========================================
// TRANSFORM CONTROLS (Rotate, Flip, Resize, Crop Trigger)
// ==========================================

import {
    uploadState,
    transformState,
    cropState,
    cropBoxNorm,
    toggleFilterButton
} from './state.js';
import { showNotification } from './notifications.js';
import { processImageWithAPI } from './api.js';
import { saveState } from './history.js';
import {
    initCrop,
    setCropMode,
    getActualCropCoords
} from './crop.js';

function updateResizeLockUI(btnResizeLock) {
    if (!btnResizeLock) return;
    if (transformState.resizeLock) {
        btnResizeLock.classList.add('text-blue-400');
        btnResizeLock.classList.remove('text-gray-500');
    } else {
        btnResizeLock.classList.add('text-gray-500');
        btnResizeLock.classList.remove('text-blue-400');
    }
}

export function syncTransformUIFromState() {
    const btnFlipH = document.getElementById('btn-flip-h');
    const btnFlipV = document.getElementById('btn-flip-v');
    const inputResizeW = document.getElementById('input-resize-w');
    const inputResizeH = document.getElementById('input-resize-h');
    const btnResizeLock = document.getElementById('btn-resize-lock');

    if (btnFlipH) toggleFilterButton(btnFlipH, transformState.flipH);
    if (btnFlipV) toggleFilterButton(btnFlipV, transformState.flipV);

    if (inputResizeW) inputResizeW.value = transformState.resizeW;
    if (inputResizeH) inputResizeH.value = transformState.resizeH;

    updateResizeLockUI(btnResizeLock);
}

export function commitActiveCropToOps() {
    if (!cropState.isCropModeActive || !cropBoxNorm.active) return false;
    const coords = getActualCropCoords();
    if (!coords || coords.width < 4 || coords.height < 4) return false;

    saveState();
    transformState.ops.push({
        type: 'crop',
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        ref_w: coords.ref_w,
        ref_h: coords.ref_h
    });
    setCropMode(false);
    return true;
}

function bindRotateButton(buttonId, angleDelta) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!uploadState.file) {
            showNotification('Vui lòng tải ảnh lên trước khi xoay ảnh!', 'warning');
            return;
        }
        saveState();
        transformState.rotate = (transformState.rotate + angleDelta) % 360;
        transformState.ops.push({ type: 'rotate', angle: angleDelta });
        setCropMode(false);
        processImageWithAPI();
    });
}

function bindFlipButton(buttonId, stateKey, direction) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!uploadState.file) {
            showNotification('Vui lòng tải ảnh lên trước khi lật ảnh!', 'warning');
            return;
        }
        saveState();
        transformState[stateKey] = !transformState[stateKey];
        transformState.ops.push({ type: 'flip', direction });
        toggleFilterButton(btn, transformState[stateKey]);
        setCropMode(false);
        processImageWithAPI();
    });
}

export function initTransforms() {
    const inputResizeW = document.getElementById('input-resize-w');
    const inputResizeH = document.getElementById('input-resize-h');
    const btnResizeLock = document.getElementById('btn-resize-lock');
    const btnApplyResize = document.getElementById('btn-apply-resize');

    initCrop({
        onToggleCropWithoutImage: () => {
            showNotification('Vui lòng tải ảnh lên trước khi chọn vùng cắt (Crop)!', 'warning');
        },
        onApplyCrop: () => {
            if (!uploadState.file || !cropState.isCropModeActive || !cropBoxNorm.active) {
                showNotification('Vui lòng bật khung cắt và chọn vùng ảnh cần cắt!', 'warning');
                return;
            }
            const coords = getActualCropCoords();
            if (!coords || coords.width < 4 || coords.height < 4) {
                showNotification('Vùng cắt quá nhỏ, vui lòng kéo vùng cắt lớn hơn!', 'warning');
                return;
            }

            commitActiveCropToOps();
            processImageWithAPI();
            showNotification(`Đã áp dụng cắt ảnh (${coords.width}×${coords.height}px)!`, 'success');
        }
    });

    bindRotateButton('btn-rotate-left', -90);
    bindRotateButton('btn-rotate-right', 90);
    bindFlipButton('btn-flip-h', 'flipH', 'horizontal');
    bindFlipButton('btn-flip-v', 'flipV', 'vertical');

    if (btnResizeLock) {
        btnResizeLock.addEventListener('click', () => {
            transformState.resizeLock = !transformState.resizeLock;
            updateResizeLockUI(btnResizeLock);
        });
    }

    if (inputResizeW && inputResizeH) {
        inputResizeW.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (transformState.resizeLock && val > 0 && uploadState.currentWidth > 0) {
                const ratio = uploadState.currentHeight / uploadState.currentWidth;
                inputResizeH.value = Math.max(1, Math.round(val * ratio));
            }
        });

        inputResizeH.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (transformState.resizeLock && val > 0 && uploadState.currentHeight > 0) {
                const ratio = uploadState.currentWidth / uploadState.currentHeight;
                inputResizeW.value = Math.max(1, Math.round(val * ratio));
            }
        });
    }

    if (btnApplyResize) {
        btnApplyResize.addEventListener('click', () => {
            if (!uploadState.file) {
                showNotification('Vui lòng tải ảnh lên trước khi đổi kích thước!', 'warning');
                return;
            }
            const w = parseInt(inputResizeW ? inputResizeW.value : '0', 10);
            const h = parseInt(inputResizeH ? inputResizeH.value : '0', 10);
            if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
                showNotification('Lỗi: Kích thước chiều rộng và chiều cao phải lớn hơn 0!', 'error');
                return;
            }
            saveState();
            transformState.resizeW = w;
            transformState.resizeH = h;
            transformState.ops.push({ type: 'resize', width: w, height: h });
            setCropMode(false);
            processImageWithAPI();
            showNotification(`Đã đổi kích thước ảnh thành ${w}x${h}px!`, 'success');
        });
    }
}
