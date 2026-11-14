// ==========================================
// FLASK OPENCV API INTEGRATION (Fetch API)
// ==========================================

import {
    API_BASE_URL,
    uploadState,
    filterState,
    transformState,
    uiState,
    undoStack,
    redoStack,
    isDefaultState,
    setCurrentDimensions,
    replaceEditorState,
    serializeEditorState
} from './state.js';
import { showNotification } from './notifications.js';

let hasPendingRequest = false;
let onStateReverted = null;
// Trạng thái cuối cùng đã hiển thị thành công trên preview (kèm Undo/Redo stack tương ứng)
let lastAppliedSnapshot = null;

function takeSnapshot() {
    return {
        file: uploadState.file,
        state: serializeEditorState(),
        undo: [...undoStack],
        redo: [...redoStack],
        width: uploadState.currentWidth,
        height: uploadState.currentHeight
    };
}

/** Ghi nhận trạng thái hiện tại là trạng thái hợp lệ (gọi khi tải ảnh mới). */
export function markCurrentStateApplied() {
    lastAppliedSnapshot = takeSnapshot();
}

/**
 * Khi xử lý thất bại, đưa bộ lọc/biến đổi và Undo/Redo về trạng thái thành công gần nhất
 * để giao diện luôn khớp với ảnh đang hiển thị và thao tác lỗi không bị gửi lại ở các lần sau.
 */
function revertToLastAppliedState() {
    const snapshot = lastAppliedSnapshot;
    if (!snapshot || snapshot.file !== uploadState.file || snapshot.state === serializeEditorState()) {
        return;
    }
    const parsed = JSON.parse(snapshot.state);
    replaceEditorState(parsed.filters, parsed.transforms);
    undoStack.splice(0, undoStack.length, ...snapshot.undo);
    redoStack.splice(0, redoStack.length, ...snapshot.redo);
    applyDimensionsAndSyncInputs(snapshot.width, snapshot.height);
    if (onStateReverted) onStateReverted();
}

export function initImageProcessing({ onStateReverted: handler }) {
    onStateReverted = handler;
}

function applyDimensionsAndSyncInputs(width, height) {
    setCurrentDimensions(width, height);
    const inputResizeW = document.getElementById('input-resize-w');
    const inputResizeH = document.getElementById('input-resize-h');
    if (inputResizeW) inputResizeW.value = width;
    if (inputResizeH) inputResizeH.value = height;
}

function updateFacesBadge(facesHeader) {
    const badgeFaces = document.getElementById('badge-faces-count');
    const faceFeatureOn = filterState.faceBlur || filterState.faceDetectBox;

    if (facesHeader !== null && faceFeatureOn) {
        const facesCount = parseInt(facesHeader, 10) || 0;
        filterState.facesDetected = facesCount;
        if (badgeFaces) {
            badgeFaces.textContent = `${facesCount} khuôn mặt`;
            badgeFaces.classList.remove('hidden');
        }
        if (facesCount === 0) {
            showNotification('Không tìm thấy khuôn mặt nào trong ảnh.', 'info');
        }
    } else if (badgeFaces && !faceFeatureOn) {
        badgeFaces.classList.add('hidden');
    }
}

async function readErrorMessage(response) {
    try {
        const errData = await response.json();
        if (errData && errData.error) return errData.error;
    } catch {
        // Bỏ qua nếu response không phải JSON
    }
    return `Lỗi xử lý ảnh (HTTP ${response.status}).`;
}

/** Tạo FormData gồm ảnh gốc và toàn bộ tham số chỉnh sửa (dùng cho xử lý và lưu lịch sử). */
export function buildProcessFormData() {
    const formData = new FormData();
    formData.append('image', uploadState.file, uploadState.fileName);
    formData.append('operation', 'pipeline');
    formData.append('brightness', String(filterState.brightness));
    formData.append('contrast', String(filterState.contrast));
    formData.append('blur', String(filterState.blur));
    formData.append('grayscale', String(filterState.grayscale));
    formData.append('sharpen', String(filterState.sharpen));
    formData.append('edge_detection', String(filterState.edgeDetection));
    formData.append('face_blur', String(filterState.faceBlur));
    formData.append('face_blur_strength', String(filterState.faceBlurStrength));
    formData.append('face_blur_type', String(filterState.faceBlurType));
    formData.append('face_detect_box', String(filterState.faceDetectBox));
    formData.append('transform_ops', JSON.stringify(transformState.ops || []));
    return formData;
}

export function setLoadingState(loading) {
    uiState.isProcessing = loading;
    const imagePreview = document.getElementById('image-preview');
    const btnApplyChanges = document.getElementById('btn-apply-changes');

    if (imagePreview) {
        imagePreview.style.opacity = loading ? '0.6' : '1';
    }
    if (btnApplyChanges) {
        btnApplyChanges.disabled = loading;
        btnApplyChanges.textContent = loading ? 'Đang xử lý OpenCV...' : 'Áp dụng thay đổi';
    }
}

function setProcessedImage(blob) {
    if (uploadState.currentProcessedUrl) {
        URL.revokeObjectURL(uploadState.currentProcessedUrl);
    }
    uploadState.currentProcessedUrl = blob ? URL.createObjectURL(blob) : '';
    uploadState.currentProcessedType = blob ? blob.type : '';

    const imagePreview = document.getElementById('image-preview');
    if (imagePreview && !uiState.isComparing) {
        imagePreview.src = uploadState.currentProcessedUrl || uploadState.previewUrl;
    }
}

export async function processImageWithAPI() {
    if (!uploadState.file) return;
    if (uiState.isProcessing) {
        hasPendingRequest = true;
        return;
    }

    if (isDefaultState()) {
        setProcessedImage(null);
        applyDimensionsAndSyncInputs(uploadState.originalWidth, uploadState.originalHeight);
        markCurrentStateApplied();
        return;
    }

    const requestSnapshot = takeSnapshot();
    const isStale = () => requestSnapshot.file !== uploadState.file;
    let failed = false;

    setLoadingState(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/process`, {
            method: 'POST',
            body: buildProcessFormData()
        });
        if (isStale()) return; // Người dùng đã tải ảnh khác trong lúc chờ: bỏ kết quả cũ

        if (!response.ok) {
            failed = true;
            showNotification(await readErrorMessage(response), 'error');
            return;
        }

        const outW = parseInt(response.headers.get('X-Image-Width') || '', 10);
        const outH = parseInt(response.headers.get('X-Image-Height') || '', 10);
        if (outW > 0 && outH > 0) {
            applyDimensionsAndSyncInputs(outW, outH);
        }
        updateFacesBadge(response.headers.get('X-Faces-Detected'));

        const resultBlob = await response.blob();
        if (isStale()) return;
        setProcessedImage(resultBlob);
        lastAppliedSnapshot = {
            ...requestSnapshot,
            width: uploadState.currentWidth,
            height: uploadState.currentHeight
        };
    } catch {
        if (isStale()) return;
        failed = true;
        showNotification(
            'Không thể kết nối tới máy chủ xử lý ảnh Flask. Vui lòng kiểm tra Backend đã chạy chưa.',
            'error'
        );
    } finally {
        setLoadingState(false);
        if (failed) {
            hasPendingRequest = false;
            revertToLastAppliedState();
        } else if (hasPendingRequest) {
            hasPendingRequest = false;
            processImageWithAPI();
        }
    }
}
