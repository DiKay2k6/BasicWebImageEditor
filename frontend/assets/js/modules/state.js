// ==========================================
// CENTRALIZED APPLICATION STATE
// ==========================================

export const API_BASE_URL = (
    window.location.protocol.startsWith('http') && window.location.port === '5055'
) ? '' : 'http://127.0.0.1:5055';

export const uploadState = {
    file: null,
    fileName: '',
    fileType: '',
    previewUrl: '',
    currentProcessedUrl: '',
    originalWidth: 1920,
    originalHeight: 1080,
    currentWidth: 1920,
    currentHeight: 1080
};

export const filterState = {
    brightness: 0,
    contrast: 0,
    blur: 0,
    grayscale: false,
    sharpen: false,
    edgeDetection: false,
    faceBlur: false,
    faceBlurStrength: 30,
    faceBlurType: 'gaussian',
    faceDetectBox: false,
    facesDetected: 0
};

export const transformState = {
    rotate: 0,
    flipH: false,
    flipV: false,
    resizeW: 1920,
    resizeH: 1080,
    resizeLock: true,
    ops: []
};

export const cropState = {
    isCropModeActive: false
};

export const cropBoxNorm = {
    active: false,
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8
};

export const uiState = {
    activeTab: 'filters',
    isComparing: false,
    isProcessing: false
};

export const undoStack = [];
export const redoStack = [];

export function setCurrentDimensions(width, height) {
    uploadState.currentWidth = width;
    uploadState.currentHeight = height;
    transformState.resizeW = width;
    transformState.resizeH = height;
}

export function resetStatesForNewImage(width, height) {
    Object.assign(filterState, {
        brightness: 0,
        contrast: 0,
        blur: 0,
        grayscale: false,
        sharpen: false,
        edgeDetection: false,
        faceBlur: false,
        faceBlurStrength: 30,
        faceBlurType: 'gaussian',
        faceDetectBox: false,
        facesDetected: 0
    });

    Object.assign(transformState, {
        rotate: 0,
        flipH: false,
        flipV: false,
        resizeW: width,
        resizeH: height,
        resizeLock: true,
        ops: []
    });

    setCurrentDimensions(width, height);
    cropState.isCropModeActive = false;
    cropBoxNorm.active = false;

    undoStack.length = 0;
    redoStack.length = 0;
}

export function replaceEditorState(filters, transforms) {
    Object.assign(filterState, {
        brightness: Number(filters?.brightness ?? 0),
        contrast: Number(filters?.contrast ?? 0),
        blur: Number(filters?.blur ?? 0),
        grayscale: Boolean(filters?.grayscale),
        sharpen: Boolean(filters?.sharpen),
        edgeDetection: Boolean(filters?.edgeDetection),
        faceBlur: Boolean(filters?.faceBlur),
        faceBlurStrength: Number(filters?.faceBlurStrength ?? 30),
        faceBlurType: String(filters?.faceBlurType ?? 'gaussian'),
        faceDetectBox: Boolean(filters?.faceDetectBox),
        facesDetected: Number(filters?.facesDetected ?? 0)
    });

    Object.assign(transformState, {
        rotate: Number(transforms?.rotate ?? 0),
        flipH: Boolean(transforms?.flipH),
        flipV: Boolean(transforms?.flipV),
        resizeW: Number(transforms?.resizeW ?? uploadState.currentWidth),
        resizeH: Number(transforms?.resizeH ?? uploadState.currentHeight),
        resizeLock: transforms?.resizeLock !== undefined ? Boolean(transforms.resizeLock) : true,
        ops: Array.isArray(transforms?.ops)
            ? transforms.ops.map((op) => ({ ...op }))
            : []
    });
}

export function serializeEditorState() {
    return JSON.stringify({
        filters: filterState,
        transforms: transformState
    });
}

export function isDefaultState() {
    return (
        Number(filterState.brightness) === 0 &&
        Number(filterState.contrast) === 0 &&
        Number(filterState.blur) === 0 &&
        !filterState.grayscale &&
        !filterState.sharpen &&
        !filterState.edgeDetection &&
        !filterState.faceBlur &&
        !filterState.faceDetectBox &&
        (!transformState.ops || transformState.ops.length === 0)
    );
}

export function toggleFilterButton(btn, isActive) {
    if (!btn) return;
    if (isActive) {
        btn.classList.add('border-blue-500', 'bg-blue-600/20', 'text-blue-400');
        btn.classList.remove('border-gray-700', 'bg-gray-800', 'text-gray-300');
    } else {
        btn.classList.remove('border-blue-500', 'bg-blue-600/20', 'text-blue-400');
        btn.classList.add('border-gray-700', 'bg-gray-800', 'text-gray-300');
    }
}
