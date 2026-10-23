// ==========================================
// IMAGE UPLOAD & PREVIEW
// ==========================================

import {
    uploadState,
    resetStatesForNewImage
} from './state.js';
import { showNotification } from './notifications.js';

export function initUpload({ onNewImageLoaded }) {
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-upload-input');
    const btnUploadSelect = document.getElementById('btn-upload-select');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    function handleFile(file) {
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
        const validExts = ['jpg', 'jpeg', 'png'];

        if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
            showNotification('Lỗi: File không hợp lệ! Vui lòng chọn ảnh định dạng JPG, JPEG hoặc PNG.', 'error');
            return;
        }

        if (uploadState.previewUrl) {
            URL.revokeObjectURL(uploadState.previewUrl);
        }
        if (uploadState.currentProcessedUrl) {
            URL.revokeObjectURL(uploadState.currentProcessedUrl);
        }

        uploadState.file = file;
        uploadState.fileName = file.name;
        uploadState.fileType = file.type;
        uploadState.previewUrl = URL.createObjectURL(file);
        uploadState.currentProcessedUrl = '';

        const tempImg = new Image();
        tempImg.onload = () => {
            uploadState.originalWidth = tempImg.naturalWidth || 1920;
            uploadState.originalHeight = tempImg.naturalHeight || 1080;
            uploadState.currentWidth = uploadState.originalWidth;
            uploadState.currentHeight = uploadState.originalHeight;

            resetStatesForNewImage(uploadState.originalWidth, uploadState.originalHeight);
            if (onNewImageLoaded) {
                onNewImageLoaded(uploadState.originalWidth, uploadState.originalHeight);
            }
        };
        tempImg.src = uploadState.previewUrl;

        if (dropzone) dropzone.classList.add('hidden');
        if (previewContainer) previewContainer.classList.remove('hidden');
        if (imagePreview) {
            imagePreview.src = uploadState.previewUrl;
        }
    }

    if (fileInput) {
        fileInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
            fileInput.value = '';
        });
    }

    if (btnUploadSelect && fileInput) {
        btnUploadSelect.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
    }

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', (e) => {
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-blue-500');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('border-blue-500');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-blue-500');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }
}
