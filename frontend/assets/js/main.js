document.addEventListener('DOMContentLoaded', () => {
    // Tab Elements
    const btnFilters = document.getElementById('btn-tab-filters');
    const btnTransform = document.getElementById('btn-tab-transform');
    const tabFilters = document.getElementById('tab-filters');
    const tabTransform = document.getElementById('tab-transform');

    if (btnFilters && btnTransform && tabFilters && tabTransform) {
        // Active classes for a selected tab
        const activeClasses = ['text-blue-400', 'border-b-2', 'border-blue-500'];
        // Inactive classes for an unselected tab
        const inactiveClasses = ['text-gray-400', 'border-transparent', 'hover:text-gray-200', 'hover:bg-gray-800/50'];

        function switchTab(selected) {
            if (selected === 'filters') {
                // Show Filters Content
                tabFilters.classList.remove('hidden');
                tabTransform.classList.add('hidden');
                
                // Update Filters Tab State (Active)
                btnFilters.classList.add(...activeClasses);
                btnFilters.classList.remove(...inactiveClasses);
                
                // Update Transform Tab State (Inactive)
                btnTransform.classList.remove(...activeClasses);
                btnTransform.classList.add(...inactiveClasses);
            } else if (selected === 'transform') {
                // Show Transform Content
                tabTransform.classList.remove('hidden');
                tabFilters.classList.add('hidden');
                
                // Update Transform Tab State (Active)
                // We use purple for transform to match the icon
                btnTransform.classList.add('text-purple-400', 'border-b-2', 'border-purple-500');
                btnTransform.classList.remove(...inactiveClasses, ...activeClasses); // ensure blue active classes are removed
                
                // Update Filters Tab State (Inactive)
                btnFilters.classList.remove(...activeClasses);
                btnFilters.classList.add(...inactiveClasses);
            }
        }

        // Event Listeners
        btnFilters.addEventListener('click', () => switchTab('filters'));
        btnTransform.addEventListener('click', () => switchTab('transform'));
    }

    // Filter Controls
    const sliderBrightness = document.getElementById('slider-brightness');
    const valBrightness = document.getElementById('val-brightness');
    const sliderContrast = document.getElementById('slider-contrast');
    const valContrast = document.getElementById('val-contrast');
    const sliderBlur = document.getElementById('slider-blur');
    const valBlur = document.getElementById('val-blur');

    // Filter State (Lưu trạng thái giao diện)
    let filterState = {
        brightness: 0,
        contrast: 0,
        blur: 0,
        grayscale: false,
        sharpen: false,
        edgeDetection: false
    };

    if (sliderBrightness && valBrightness) {
        sliderBrightness.addEventListener('mousedown', captureStateBeforeChange);
        sliderBrightness.addEventListener('touchstart', captureStateBeforeChange);
        sliderBrightness.addEventListener('change', commitStateChange);
        sliderBrightness.addEventListener('input', (e) => {
            filterState.brightness = e.target.value;
            valBrightness.textContent = filterState.brightness;
        });
    }

    if (sliderContrast && valContrast) {
        sliderContrast.addEventListener('mousedown', captureStateBeforeChange);
        sliderContrast.addEventListener('touchstart', captureStateBeforeChange);
        sliderContrast.addEventListener('change', commitStateChange);
        sliderContrast.addEventListener('input', (e) => {
            filterState.contrast = e.target.value;
            valContrast.textContent = filterState.contrast;
        });
    }

    if (sliderBlur && valBlur) {
        sliderBlur.addEventListener('mousedown', captureStateBeforeChange);
        sliderBlur.addEventListener('touchstart', captureStateBeforeChange);
        sliderBlur.addEventListener('change', commitStateChange);
        sliderBlur.addEventListener('input', (e) => {
            filterState.blur = e.target.value;
            valBlur.textContent = filterState.blur + 'px';
        });
    }

    // Instant Filter Buttons
    const btnGrayscale = document.getElementById('btn-filter-grayscale');
    const btnSharpen = document.getElementById('btn-filter-sharpen');
    const btnEdge = document.getElementById('btn-filter-edge');

    function toggleFilterButton(btn, isActive) {
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (isActive) {
            btn.classList.replace('bg-gray-800', 'bg-blue-600');
            btn.classList.replace('border-gray-700', 'border-blue-500');
            btn.classList.replace('text-gray-300', 'text-white');
            if (icon) {
                icon.classList.replace('text-gray-400', 'text-white');
            }
        } else {
            btn.classList.replace('bg-blue-600', 'bg-gray-800');
            btn.classList.replace('border-blue-500', 'border-gray-700');
            btn.classList.replace('text-white', 'text-gray-300');
            if (icon) {
                icon.classList.replace('text-white', 'text-gray-400');
            }
        }
    }

    if (btnGrayscale) {
        btnGrayscale.addEventListener('click', () => {
            saveState();
            filterState.grayscale = !filterState.grayscale;
            toggleFilterButton(btnGrayscale, filterState.grayscale);
        });
    }

    if (btnSharpen) {
        btnSharpen.addEventListener('click', () => {
            saveState();
            filterState.sharpen = !filterState.sharpen;
            toggleFilterButton(btnSharpen, filterState.sharpen);
        });
    }

    if (btnEdge) {
        btnEdge.addEventListener('click', () => {
            saveState();
            filterState.edgeDetection = !filterState.edgeDetection;
            toggleFilterButton(btnEdge, filterState.edgeDetection);
        });
    }

    // ==========================================
    // TRANSFORM TOOLS
    // ==========================================
    let transformState = {
        rotate: 0,
        flipH: false,
        flipV: false,
        cropRatio: 'free',
        resizeW: 1920,
        resizeH: 1080,
        resizeLock: true
    };

    // Rotate & Flip Elements
    const btnRotateLeft = document.getElementById('btn-rotate-left');
    const btnRotateRight = document.getElementById('btn-rotate-right');
    const btnFlipH = document.getElementById('btn-flip-h');
    const btnFlipV = document.getElementById('btn-flip-v');

    if (btnRotateLeft) {
        btnRotateLeft.addEventListener('click', () => {
            saveState();
            transformState.rotate = (transformState.rotate - 90) % 360;
            if (transformState.rotate <= -360) transformState.rotate = 0;
        });
    }

    if (btnRotateRight) {
        btnRotateRight.addEventListener('click', () => {
            saveState();
            transformState.rotate = (transformState.rotate + 90) % 360;
            if (transformState.rotate >= 360) transformState.rotate = 0;
        });
    }

    if (btnFlipH) {
        btnFlipH.addEventListener('click', () => {
            saveState();
            transformState.flipH = !transformState.flipH;
            toggleFilterButton(btnFlipH, transformState.flipH);
        });
    }

    if (btnFlipV) {
        btnFlipV.addEventListener('click', () => {
            saveState();
            transformState.flipV = !transformState.flipV;
            toggleFilterButton(btnFlipV, transformState.flipV);
        });
    }

    // Crop Elements
    const btnCropFree = document.getElementById('btn-crop-free');
    const btnCrop11 = document.getElementById('btn-crop-1-1');
    const btnCrop169 = document.getElementById('btn-crop-16-9');
    
    function updateCropUI(selectedRatio) {
        transformState.cropRatio = selectedRatio;
        
        const activeClasses = ['bg-blue-600/20', 'text-blue-400', 'border-blue-500/50'];
        const inactiveClasses = ['bg-gray-800', 'text-gray-300', 'border-gray-700', 'hover:bg-gray-700'];
        
        [btnCropFree, btnCrop11, btnCrop169].forEach(btn => {
            if (!btn) return;
            btn.classList.remove(...activeClasses, ...inactiveClasses);
        });

        if (btnCropFree) btnCropFree.classList.add(...(selectedRatio === 'free' ? activeClasses : inactiveClasses));
        if (btnCrop11) btnCrop11.classList.add(...(selectedRatio === '1:1' ? activeClasses : inactiveClasses));
        if (btnCrop169) btnCrop169.classList.add(...(selectedRatio === '16:9' ? activeClasses : inactiveClasses));
    }

    if (btnCropFree) btnCropFree.addEventListener('click', () => { saveState(); updateCropUI('free'); });
    if (btnCrop11) btnCrop11.addEventListener('click', () => { saveState(); updateCropUI('1:1'); });
    if (btnCrop169) btnCrop169.addEventListener('click', () => { saveState(); updateCropUI('16:9'); });

    // Resize Elements
    const inputResizeW = document.getElementById('input-resize-w');
    const inputResizeH = document.getElementById('input-resize-h');
    const btnResizeLock = document.getElementById('btn-resize-lock');

    if (inputResizeW) {
        inputResizeW.addEventListener('focus', captureStateBeforeChange);
        inputResizeW.addEventListener('blur', commitStateChange);
        inputResizeW.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (val < 1) { 
                val = 1; 
                // Only update visually on blur to not disrupt typing
            }
            transformState.resizeW = val || 1;
        });
    }

    if (inputResizeH) {
        inputResizeH.addEventListener('focus', captureStateBeforeChange);
        inputResizeH.addEventListener('blur', commitStateChange);
        inputResizeH.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (val < 1) { 
                val = 1;
            }
            transformState.resizeH = val || 1;
        });
    }

    if (btnResizeLock) {
        btnResizeLock.addEventListener('click', () => {
            saveState();
            transformState.resizeLock = !transformState.resizeLock;
            if (transformState.resizeLock) {
                btnResizeLock.classList.add('text-blue-400');
                btnResizeLock.classList.remove('text-gray-500');
            } else {
                btnResizeLock.classList.add('text-gray-500');
                btnResizeLock.classList.remove('text-blue-400');
            }
        });
    }

    // ==========================================
    // IMAGE UPLOAD & PREVIEW
    // ==========================================
    const uploadState = {
        file: null,
        fileName: '',
        fileType: '',
        previewUrl: ''
    };

    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-upload-input');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    function handleFile(file) {
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Lỗi: File không hợp lệ! Vui lòng chọn ảnh định dạng JPG, JPEG hoặc PNG.');
            return;
        }

        // Revoke old URL if exists to avoid memory leaks
        if (uploadState.previewUrl) {
            URL.revokeObjectURL(uploadState.previewUrl);
        }

        // Update State
        uploadState.file = file;
        uploadState.fileName = file.name;
        uploadState.fileType = file.type;
        uploadState.previewUrl = URL.createObjectURL(file);

        // Update UI
        if (dropzone) dropzone.classList.add('hidden');
        if (previewContainer) previewContainer.classList.remove('hidden');
        if (imagePreview) {
            imagePreview.src = uploadState.previewUrl;
        }
    }

    if (dropzone && fileInput) {
        // Trigger file input on dropzone click
        dropzone.addEventListener('click', (e) => {
            // Check to avoid calling click twice if they actually clicked the input directly
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
            // Reset input so the same file can be selected again if needed (e.g. they remove and re-add)
            fileInput.value = '';
        });
    }

    // ==========================================
    // UNDO / REDO STATE MANAGEMENT
    // ==========================================
    const undoStack = [];
    const redoStack = [];
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');

    function updateUndoRedoUI() {
        if (btnUndo) {
            if (undoStack.length > 0) {
                btnUndo.disabled = false;
                btnUndo.classList.remove('opacity-50', 'cursor-not-allowed');
                btnUndo.classList.add('hover:text-white', 'hover:bg-gray-800');
            } else {
                btnUndo.disabled = true;
                btnUndo.classList.add('opacity-50', 'cursor-not-allowed');
                btnUndo.classList.remove('hover:text-white', 'hover:bg-gray-800');
            }
        }

        if (btnRedo) {
            if (redoStack.length > 0) {
                btnRedo.disabled = false;
                btnRedo.classList.remove('opacity-50', 'cursor-not-allowed');
                btnRedo.classList.add('hover:text-white', 'hover:bg-gray-800');
            } else {
                btnRedo.disabled = true;
                btnRedo.classList.add('opacity-50', 'cursor-not-allowed');
                btnRedo.classList.remove('hover:text-white', 'hover:bg-gray-800');
            }
        }
    }

    function applyState(stateStr) {
        const state = JSON.parse(stateStr);
        filterState = state.filters;
        transformState = state.transforms;

        // Apply to UI: Filters
        if (sliderBrightness) { sliderBrightness.value = filterState.brightness; valBrightness.textContent = filterState.brightness; }
        if (sliderContrast) { sliderContrast.value = filterState.contrast; valContrast.textContent = filterState.contrast; }
        if (sliderBlur) { sliderBlur.value = filterState.blur; valBlur.textContent = filterState.blur + 'px'; }

        if (btnGrayscale) toggleFilterButton(btnGrayscale, filterState.grayscale);
        if (btnSharpen) toggleFilterButton(btnSharpen, filterState.sharpen);
        if (btnEdge) toggleFilterButton(btnEdge, filterState.edgeDetection);

        // Apply to UI: Transforms
        if (btnFlipH) toggleFilterButton(btnFlipH, transformState.flipH);
        if (btnFlipV) toggleFilterButton(btnFlipV, transformState.flipV);
        updateCropUI(transformState.cropRatio);

        if (inputResizeW) inputResizeW.value = transformState.resizeW;
        if (inputResizeH) inputResizeH.value = transformState.resizeH;

        if (btnResizeLock) {
            if (transformState.resizeLock) {
                btnResizeLock.classList.add('text-blue-400');
                btnResizeLock.classList.remove('text-gray-500');
            } else {
                btnResizeLock.classList.add('text-gray-500');
                btnResizeLock.classList.remove('text-blue-400');
            }
        }
    }

    // Call this before modifying state directly from a button click
    function saveState() {
        const currentStateStr = JSON.stringify({ filters: filterState, transforms: transformState });
        undoStack.push(currentStateStr);
        redoStack.length = 0;
        updateUndoRedoUI();
    }

    let pendingStateStr = null;
    
    // Call this on mousedown/touchstart/focus
    function captureStateBeforeChange() {
        if (!pendingStateStr) {
            pendingStateStr = JSON.stringify({ filters: filterState, transforms: transformState });
        }
    }

    // Call this on change/blur
    function commitStateChange() {
        if (pendingStateStr) {
            const currentStateStr = JSON.stringify({ filters: filterState, transforms: transformState });
            if (pendingStateStr !== currentStateStr) {
                undoStack.push(pendingStateStr);
                redoStack.length = 0;
                updateUndoRedoUI();
            }
            pendingStateStr = null;
        }
    }

    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            if (undoStack.length > 0) {
                // Save current state to redo stack
                redoStack.push(JSON.stringify({ filters: filterState, transforms: transformState }));
                // Pop previous state and apply
                const prevStateStr = undoStack.pop();
                applyState(prevStateStr);
                updateUndoRedoUI();
            }
        });
    }

    if (btnRedo) {
        btnRedo.addEventListener('click', () => {
            if (redoStack.length > 0) {
                // Save current state to undo stack
                undoStack.push(JSON.stringify({ filters: filterState, transforms: transformState }));
                // Pop next state and apply
                const nextStateStr = redoStack.pop();
                applyState(nextStateStr);
                updateUndoRedoUI();
            }
        });
    }

    // ==========================================
    // COMPARE ORIGINAL / CURRENT
    // ==========================================
    const btnCompare = document.getElementById('btn-compare');
    let isComparing = false;

    function showOriginal() {
        if (!uploadState.previewUrl) return;
        isComparing = true;
        
        // Highlight button
        btnCompare.classList.add('text-blue-400');
        btnCompare.classList.remove('text-gray-400');
        
        // Visual indicator that we are viewing the original
        let badge = document.getElementById('original-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'original-badge';
            badge.className = 'absolute top-4 right-4 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded shadow-lg font-medium tracking-wide z-10';
            badge.textContent = 'Bản gốc';
            if (previewContainer) {
                previewContainer.appendChild(badge);
            }
        }
        if (badge) badge.classList.remove('hidden');

        // Giai đoạn tương lai: sẽ gán src ảnh gốc
        // imagePreview.src = uploadState.previewUrl; 
    }

    function hideOriginal() {
        if (!uploadState.previewUrl) return;
        isComparing = false;
        
        // Reset button
        btnCompare.classList.remove('text-blue-400');
        btnCompare.classList.add('text-gray-400');
        
        const badge = document.getElementById('original-badge');
        if (badge) {
            badge.classList.add('hidden');
        }

        // Giai đoạn tương lai: sẽ gán src ảnh đã chỉnh sửa
        // imagePreview.src = uploadState.currentProcessedUrl; 
    }

    if (btnCompare) {
        // Desktop
        btnCompare.addEventListener('mousedown', (e) => {
            if(e.button === 0) showOriginal(); // Left click only
        });
        document.addEventListener('mouseup', () => {
            if (isComparing) hideOriginal();
        });
        
        // Mobile
        btnCompare.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            showOriginal();
        });
        document.addEventListener('touchend', () => {
            if (isComparing) hideOriginal();
        });
    }

    // ==========================================
    // DOWNLOAD IMAGE
    // ==========================================
    const btnDownload = document.getElementById('btn-download');

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            if (!uploadState.previewUrl) {
                alert('Vui lòng tải ảnh lên trước khi tải xuống!');
                return;
            }

            // Giai đoạn 2: Tải xuống preview URL hiện tại (ảnh chưa qua xử lý)
            // Các Giai đoạn sau sẽ gọi API hoặc Canvas để tải ảnh đã qua xử lý OpenCV
            const a = document.createElement('a');
            a.href = uploadState.previewUrl;
            
            // Đặt tên file tự động dựa trên file gốc
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
});
