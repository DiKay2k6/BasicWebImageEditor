// ==========================================
// WEB IMAGE EDITOR - MAIN ENTRY POINT
// ==========================================

import { uploadState, uiState } from './editor/state.js';
import {
    initImageProcessing,
    markCurrentStateApplied,
    processImageWithAPI
} from './services/api.js';
import { initUpload } from './editor/upload.js';
import { initFilters, syncFilterUIFromState } from './editor/filters.js';
import {
    initTransforms,
    syncTransformUIFromState
} from './editor/transforms.js';
import { setCropMode, updateCropOverlayVisibility } from './editor/crop.js';
import { initHistory, updateUndoRedoUI } from './editor/history.js';
import { initCompareAndDownload } from './editor/compare-download.js';
import { initAccount, resetSavedHistory } from './editor/account.js';

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

function syncEditorUI() {
    setCropMode(false);
    syncFilterUIFromState();
    syncTransformUIFromState();
    updateUndoRedoUI();
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();

    // Xử lý thất bại → trạng thái đã được khôi phục, đồng bộ lại giao diện
    initImageProcessing({ onStateReverted: syncEditorUI });

    initUpload({
        onNewImageLoaded: () => {
            resetSavedHistory();
            markCurrentStateApplied();
            syncEditorUI();
        }
    });

    initFilters();
    initTransforms();

    initHistory({
        onStateRestored: () => {
            syncEditorUI();
            if (uploadState.file) {
                processImageWithAPI();
            }
        }
    });

    initCompareAndDownload();
    initAccount();
});
