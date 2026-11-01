// ==========================================
// FLASK OPENCV API INTEGRATION (Fetch API)
// ==========================================

import {
    API_BASE_URL,
    uploadState,
    filterState,
    transformState,
    uiState,
    isDefaultState,
    setCurrentDimensions
} from './state.js';
import { showNotification } from './notifications.js';

function applyDimensionsAndSyncInputs(width, height) {
    setCurrentDimensions(width, height);
    const inputResizeW = document.getElementById('input-resize-w');
    const inputResizeH = document.getElementById('input-resize-h');
    if (inputResizeW) inputResizeW.value = width;
    if (inputResizeH) inputResizeH.value = height;
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

let hasPendingRequest = false;

export async function processImageWithAPI() {
    if (!uploadState.file) return;
    if (uiState.isProcessing) {
        hasPendingRequest = true;
        return;
    }

    const imagePreview = document.getElementById('image-preview');

    if (isDefaultState()) {
        if (uploadState.currentProcessedUrl) {
            URL.revokeObjectURL(uploadState.currentProcessedUrl);
            uploadState.currentProcessedUrl = '';
        }
        applyDimensionsAndSyncInputs(uploadState.originalWidth, uploadState.originalHeight);
        if (imagePreview && !uiState.isComparing) {
            imagePreview.src = uploadState.previewUrl;
        }
        return;
    }

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

    setLoadingState(true);

    try {
        const response = await fetch(`${API_BASE_URL}/api/process`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errorMsg = `Lỗi xử lý ảnh (HTTP ${response.status}).`;
            try {
                const errData = await response.json();
                if (errData && errData.error) {
                    errorMsg = errData.error;
                }
            } catch (_parseErr) {
                // Bỏ qua nếu response không phải JSON
            }
            showNotification(errorMsg, 'error');
            return;
        }

        const outW = parseInt(response.headers.get('X-Image-Width') || '', 10);
        const outH = parseInt(response.headers.get('X-Image-Height') || '', 10);
        if (outW > 0 && outH > 0) {
            applyDimensionsAndSyncInputs(outW, outH);
        }

        const facesHeader = response.headers.get('X-Faces-Detected');
        const badgeFaces = document.getElementById('badge-faces-count');
        if (facesHeader !== null && (filterState.faceBlur || filterState.faceDetectBox)) {
            const facesCount = parseInt(facesHeader, 10) || 0;
            filterState.facesDetected = facesCount;
            if (badgeFaces) {
                badgeFaces.textContent = `${facesCount} khuôn mặt`;
                badgeFaces.classList.remove('hidden');
            }
            if (facesCount === 0) {
                showNotification('Không tìm thấy khuôn mặt nào trong ảnh.', 'info');
            }
        } else if (badgeFaces && !filterState.faceBlur && !filterState.faceDetectBox) {
            badgeFaces.classList.add('hidden');
        }

        const resultBlob = await response.blob();
        if (uploadState.currentProcessedUrl) {
            URL.revokeObjectURL(uploadState.currentProcessedUrl);
        }
        uploadState.currentProcessedUrl = URL.createObjectURL(resultBlob);

        if (imagePreview && !uiState.isComparing) {
            imagePreview.src = uploadState.currentProcessedUrl;
        }
    } catch (_networkErr) {
        showNotification(
            'Không thể kết nối tới máy chủ xử lý ảnh Flask. Vui lòng kiểm tra Backend đã chạy chưa.',
            'error'
        );
    } finally {
        setLoadingState(false);
        if (hasPendingRequest) {
            hasPendingRequest = false;
            processImageWithAPI();
        }
    }
}
