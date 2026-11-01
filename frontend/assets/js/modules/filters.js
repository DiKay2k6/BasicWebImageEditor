// ==========================================
// FILTER CONTROLS (Brightness, Contrast, Blur, Grayscale, Sharpen, Edge)
// ==========================================

import {
    uploadState,
    filterState,
    toggleFilterButton
} from './state.js';
import { showNotification } from './notifications.js';
import { processImageWithAPI } from './api.js';
import {
    saveState,
    captureStateBeforeChange,
    commitStateChange
} from './history.js';

export function syncFilterUIFromState() {
    const sliderBrightness = document.getElementById('slider-brightness');
    const valBrightness = document.getElementById('val-brightness');
    const sliderContrast = document.getElementById('slider-contrast');
    const valContrast = document.getElementById('val-contrast');
    const sliderBlur = document.getElementById('slider-blur');
    const valBlur = document.getElementById('val-blur');

    const btnGrayscale = document.getElementById('btn-filter-grayscale');
    const btnSharpen = document.getElementById('btn-filter-sharpen');
    const btnEdge = document.getElementById('btn-filter-edge');
    const btnFaceBlur = document.getElementById('btn-filter-face-blur');
    const btnFaceBox = document.getElementById('btn-filter-face-box');
    const selectFaceBlurType = document.getElementById('select-face-blur-type');
    const sliderFaceBlur = document.getElementById('slider-face-blur');
    const valFaceBlur = document.getElementById('val-face-blur');
    const badgeFaces = document.getElementById('badge-faces-count');

    if (sliderBrightness && valBrightness) {
        sliderBrightness.value = filterState.brightness;
        valBrightness.textContent = String(filterState.brightness);
    }
    if (sliderContrast && valContrast) {
        sliderContrast.value = filterState.contrast;
        valContrast.textContent = String(filterState.contrast);
    }
    if (sliderBlur && valBlur) {
        sliderBlur.value = filterState.blur;
        valBlur.textContent = `${filterState.blur}px`;
    }

    if (btnGrayscale) toggleFilterButton(btnGrayscale, filterState.grayscale);
    if (btnSharpen) toggleFilterButton(btnSharpen, filterState.sharpen);
    if (btnEdge) toggleFilterButton(btnEdge, filterState.edgeDetection);

    if (btnFaceBlur) toggleFilterButton(btnFaceBlur, filterState.faceBlur);
    if (btnFaceBox) toggleFilterButton(btnFaceBox, filterState.faceDetectBox);
    if (selectFaceBlurType) selectFaceBlurType.value = filterState.faceBlurType || 'gaussian';
    if (sliderFaceBlur && valFaceBlur) {
        sliderFaceBlur.value = filterState.faceBlurStrength || 30;
        valFaceBlur.textContent = `${filterState.faceBlurStrength || 30}%`;
    }
    if (badgeFaces) {
        if ((filterState.faceBlur || filterState.faceDetectBox) && filterState.facesDetected >= 0) {
            badgeFaces.textContent = `${filterState.facesDetected} mặt`;
            badgeFaces.classList.remove('hidden');
        } else {
            badgeFaces.classList.add('hidden');
        }
    }
}

function bindFilterSlider(sliderId, labelId, stateKey, suffix = '') {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (!slider || !label) return;

    slider.addEventListener('mousedown', captureStateBeforeChange);
    slider.addEventListener('touchstart', captureStateBeforeChange, { passive: true });
    slider.addEventListener('input', (e) => {
        filterState[stateKey] = Number(e.target.value);
        label.textContent = `${e.target.value}${suffix}`;
    });
    slider.addEventListener('change', () => {
        commitStateChange();
        processImageWithAPI();
    });
}

function bindFilterToggle(buttonId, stateKey) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!uploadState.file) {
            showNotification('Vui lòng tải ảnh lên trước khi áp dụng bộ lọc!', 'warning');
            return;
        }
        saveState();
        filterState[stateKey] = !filterState[stateKey];
        toggleFilterButton(btn, filterState[stateKey]);
        processImageWithAPI();
    });
}

export function initFilters() {
    bindFilterSlider('slider-brightness', 'val-brightness', 'brightness');
    bindFilterSlider('slider-contrast', 'val-contrast', 'contrast');
    bindFilterSlider('slider-blur', 'val-blur', 'blur', 'px');
    bindFilterSlider('slider-face-blur', 'val-face-blur', 'faceBlurStrength', '%');

    bindFilterToggle('btn-filter-grayscale', 'grayscale');
    bindFilterToggle('btn-filter-sharpen', 'sharpen');
    bindFilterToggle('btn-filter-edge', 'edgeDetection');
    bindFilterToggle('btn-filter-face-blur', 'faceBlur');
    bindFilterToggle('btn-filter-face-box', 'faceDetectBox');

    const selectFaceBlurType = document.getElementById('select-face-blur-type');
    if (selectFaceBlurType) {
        selectFaceBlurType.addEventListener('change', (e) => {
            saveState();
            filterState.faceBlurType = e.target.value;
            if (filterState.faceBlur) {
                processImageWithAPI();
            }
        });
    }
}
