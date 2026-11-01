// ==========================================
// WEB IMAGE EDITOR - MAIN ENTRY POINT
// ==========================================

import { uploadState, uiState } from './modules/state.js';
import { showNotification } from './modules/notifications.js';
import { processImageWithAPI } from './modules/api.js';
import { initUpload } from './modules/upload.js';
import { initFilters, syncFilterUIFromState } from './modules/filters.js';
import {
    initTransforms,
    syncTransformUIFromState,
    commitActiveCropToOps
} from './modules/transforms.js';
import { setCropMode, updateCropOverlayVisibility } from './modules/crop.js';
import { initHistory, updateUndoRedoUI } from './modules/history.js';
import { initCompareAndDownload } from './modules/compare-download.js';

function initTabs() {
    const btnTabFilters = document.getElementById('btn-tab-filters');
    const btnTabTransform = document.getElementById('btn-tab-transform');
    const panelFilters = document.getElementById('tab-filters') || document.getElementById('panel-filters');
    const panelTransform = document.getElementById('tab-transform') || document.getElementById('panel-transform');

    if (!btnTabFilters || !btnTabTransform || !panelFilters || !panelTransform) {
        return;
    }

    btnTabFilters.addEventListener('click', () => {
        uiState.activeTab = 'filters';
        btnTabFilters.classList.add('text-blue-400', 'border-blue-400');
        btnTabFilters.classList.remove('text-gray-400', 'border-transparent');

        btnTabTransform.classList.add('text-gray-400', 'border-transparent');
        btnTabTransform.classList.remove('text-blue-400', 'border-blue-400');

        panelFilters.classList.remove('hidden');
        panelTransform.classList.add('hidden');
        setCropMode(false);
    });

    btnTabTransform.addEventListener('click', () => {
        uiState.activeTab = 'transform';
        btnTabTransform.classList.add('text-blue-400', 'border-blue-400');
        btnTabTransform.classList.remove('text-gray-400', 'border-transparent');

        btnTabFilters.classList.add('text-gray-400', 'border-transparent');
        btnTabFilters.classList.remove('text-blue-400', 'border-blue-400');

        panelTransform.classList.remove('hidden');
        panelFilters.classList.add('hidden');
        updateCropOverlayVisibility();
    });
}

function initApplyChangesButton() {
    const btnApplyChanges = document.getElementById('btn-apply-changes');
    if (!btnApplyChanges) return;

    btnApplyChanges.addEventListener('click', () => {
        if (!uploadState.file) {
            showNotification('Vui lòng tải ảnh lên trước khi áp dụng chỉnh sửa!', 'warning');
            return;
        }
        if (uiState.activeTab === 'transform') {
            commitActiveCropToOps();
        }
        processImageWithAPI();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();

    initUpload({
        onNewImageLoaded: () => {
            syncFilterUIFromState();
            syncTransformUIFromState();
            updateUndoRedoUI();
            setCropMode(false);
        }
    });

    initFilters();
    initTransforms();

    initHistory({
        onStateRestored: () => {
            setCropMode(false);
            syncFilterUIFromState();
            syncTransformUIFromState();
            if (uploadState.file) {
                processImageWithAPI();
            }
        }
    });

    initCompareAndDownload();
    initApplyChangesButton();
});
