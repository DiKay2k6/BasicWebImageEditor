// ==========================================
// EDIT HISTORY VIEW - hiển thị danh sách lịch sử chỉnh sửa (trang Profile)
// ==========================================

import { fetchBlob } from './auth-client.js';

const objectUrlsByContainer = new WeakMap();

const FLIP_LABELS = { horizontal: 'ngang', vertical: 'dọc', both: 'cả hai chiều' };

export function formatDateTime(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatSigned(value) {
    return value > 0 ? `+${value}` : String(value);
}

/** Chuyển metadata chỉnh sửa (lưu trong MongoDB) thành các nhãn dễ đọc. */
export function describeEdits(edits = {}) {
    const filters = edits.filters || {};
    const labels = [];

    for (const step of edits.transforms || []) {
        if (step.type === 'rotate') labels.push(`Xoay ${step.angle > 0 ? 'phải' : 'trái'} ${Math.abs(step.angle)}°`);
        if (step.type === 'flip') labels.push(`Lật ${FLIP_LABELS[step.direction] || ''}`.trim());
        if (step.type === 'crop') labels.push(`Cắt ${step.width}×${step.height}`);
        if (step.type === 'resize') labels.push(`Resize ${step.width}×${step.height}`);
    }

    if (filters.brightness) labels.push(`Độ sáng ${formatSigned(filters.brightness)}`);
    if (filters.contrast) labels.push(`Tương phản ${formatSigned(filters.contrast)}`);
    if (filters.blur) labels.push(`Làm mờ ${filters.blur}px`);
    if (filters.grayscale) labels.push('Grayscale');
    if (filters.sharpen) labels.push('Sharpen');
    if (filters.edge_detection) labels.push('Edge Detection');
    if (filters.face_blur) {
        const type = filters.face_blur.type === 'pixelate' ? 'Pixelate' : 'Gaussian';
        labels.push(`Làm mờ mặt (${type} ${filters.face_blur.strength}%)`);
    }
    if (filters.face_detect_box) labels.push('Khung nhận diện');

    return labels;
}

function releaseObjectUrls(container) {
    (objectUrlsByContainer.get(container) || []).forEach((url) => URL.revokeObjectURL(url));
    objectUrlsByContainer.set(container, []);
}

function trackObjectUrl(container, url) {
    objectUrlsByContainer.get(container).push(url);
}

function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

function renderEmptyState(container, message, showEditorLink) {
    const wrapper = createElement('div', 'text-center py-10');
    const icon = createElement('div', 'inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-gray-500 mb-4');
    icon.innerHTML = '<i class="fas fa-images text-2xl"></i>';
    wrapper.append(icon, createElement('p', 'text-gray-400', message));

    if (showEditorLink) {
        const link = createElement('a', 'inline-block mt-4 text-blue-400 hover:text-blue-300 font-medium', 'Bắt đầu chỉnh sửa ngay ');
        link.href = '../index.html';
        link.insertAdjacentHTML('beforeend', '<i class="fas fa-arrow-right ml-1"></i>');
        wrapper.appendChild(link);
    }
    container.appendChild(wrapper);
}

async function loadThumbnail(container, img, item) {
    try {
        const url = URL.createObjectURL(await fetchBlob(item.image_url));
        trackObjectUrl(container, url);
        img.src = url;
    } catch {
        img.replaceWith(createElement('div', 'w-full h-full flex items-center justify-center text-xs text-gray-500', 'Không tải được ảnh'));
    }
}

function renderCard(container, item, { onDownload, onDelete }) {
    const card = createElement('article', 'bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden flex flex-col');

    const thumbBox = createElement('div', 'h-40 bg-gray-950 flex items-center justify-center');
    const img = createElement('img', 'max-w-full max-h-40 object-contain');
    img.alt = item.original_filename;
    thumbBox.appendChild(img);
    loadThumbnail(container, img, item);

    const body = createElement('div', 'p-4 flex-1 flex flex-col gap-2');
    const title = createElement('h4', 'text-sm font-semibold text-white truncate', item.original_filename);
    title.title = item.original_filename;

    const info = createElement(
        'p',
        'text-xs text-gray-400',
        `${item.width}×${item.height}px · ${formatFileSize(item.file_size)} · ${formatDateTime(item.created_at)}`
    );

    const tags = createElement('div', 'flex flex-wrap gap-1');
    const labels = describeEdits(item.edits);
    if (item.faces_detected > 0) labels.push(`${item.faces_detected} khuôn mặt`);
    (labels.length ? labels : ['Không chỉnh sửa']).forEach((label) => {
        tags.appendChild(createElement('span', 'text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30', label));
    });

    const actions = createElement('div', 'flex gap-2 mt-auto pt-2');
    const downloadBtn = createElement('button', 'flex-1 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors');
    downloadBtn.type = 'button';
    downloadBtn.innerHTML = '<i class="fas fa-download mr-1"></i> Tải xuống';
    downloadBtn.addEventListener('click', () => onDownload(item, downloadBtn));

    const deleteBtn = createElement('button', 'px-3 py-1.5 text-xs rounded-lg bg-gray-700 hover:bg-red-600 text-gray-200 transition-colors');
    deleteBtn.type = 'button';
    deleteBtn.title = 'Xóa bản ghi';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.addEventListener('click', () => onDelete(item, deleteBtn));

    actions.append(downloadBtn, deleteBtn);
    body.append(title, info, tags, actions);
    card.append(thumbBox, body);
    return card;
}

/** Vẽ lại danh sách lịch sử vào container (giải phóng blob URL của lần vẽ trước). */
export function renderHistoryList(container, items, handlers, { emptyMessage, showEditorLink = true } = {}) {
    releaseObjectUrls(container);
    container.replaceChildren();

    if (!items.length) {
        renderEmptyState(container, emptyMessage || 'Bạn chưa có lịch sử chỉnh sửa nào.', showEditorLink);
        return;
    }

    const grid = createElement('div', 'grid grid-cols-1 sm:grid-cols-2 gap-4');
    items.forEach((item) => grid.appendChild(renderCard(container, item, handlers)));
    container.appendChild(grid);
}

export function renderHistoryMessage(container, message) {
    releaseObjectUrls(container);
    container.replaceChildren(createElement('p', 'text-center text-gray-400 py-10', message));
}
