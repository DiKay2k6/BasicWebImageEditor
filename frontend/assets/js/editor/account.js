// ==========================================
// EDITOR ACCOUNT - menu tài khoản trên header & lưu ảnh vào lịch sử chỉnh sửa
// ==========================================

import { ApiError, apiRequest, fetchBlob, getCurrentUser, getInitials } from '../services/auth-client.js';
import { buildProcessFormData } from '../services/api.js';
import { showNotification } from '../utils/notifications.js';
import { uiState, uploadState } from './state.js';

let currentUser = null;
let avatarObjectUrl = '';
let savedHistoryId = null;

function updateSaveButtonUI() {
    const btnSave = document.getElementById('btn-save-history');
    if (!btnSave) return;

    if (savedHistoryId) {
        btnSave.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Cập nhật';
        btnSave.title = 'Cập nhật thay đổi mới nhất vào ảnh vừa lưu trong lịch sử';
    } else {
        btnSave.innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i> Lưu';
        btnSave.title = 'Lưu ảnh đã chỉnh sửa vào lịch sử (cần đăng nhập)';
    }
}

export function resetSavedHistory() {
    savedHistoryId = null;
    updateSaveButtonUI();
}

async function renderAccountMenu(user) {
    const link = document.getElementById('header-account');
    const nameLabel = document.getElementById('header-account-name');
    const avatarBox = document.getElementById('header-account-avatar');
    if (!link || !nameLabel || !avatarBox) return;

    currentUser = user;
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    avatarObjectUrl = '';

    if (!user) {
        resetSavedHistory();
        link.href = 'pages/login.html';
        link.title = 'Đăng nhập để lưu lịch sử chỉnh sửa';
        nameLabel.textContent = 'Đăng nhập';
        avatarBox.innerHTML = '<i class="fas fa-user text-sm"></i>';
        return;
    }

    link.href = 'pages/profile.html';
    link.title = `Hồ sơ của ${user.display_name}`;
    nameLabel.textContent = user.display_name;
    avatarBox.textContent = getInitials(user.display_name);

    if (user.has_avatar) {
        try {
            avatarObjectUrl = URL.createObjectURL(await fetchBlob('/api/profile/avatar'));
            const img = document.createElement('img');
            img.src = avatarObjectUrl;
            img.alt = 'Ảnh đại diện';
            img.className = 'w-full h-full object-cover';
            avatarBox.replaceChildren(img);
        } catch {
            // Giữ chữ cái viết tắt nếu không tải được ảnh đại diện
        }
    }
}

async function saveToHistory(button) {
    if (!uploadState.file) {
        showNotification('Vui lòng tải ảnh lên trước khi lưu!', 'warning');
        return;
    }
    if (!currentUser) {
        showNotification('Vui lòng đăng nhập để lưu ảnh vào lịch sử chỉnh sửa.', 'warning');
        return;
    }
    if (uiState.isProcessing) {
        showNotification('Ảnh đang được xử lý, vui lòng đợi hoàn tất rồi lưu.', 'warning');
        return;
    }

    button.disabled = true;
    button.classList.add('opacity-60', 'cursor-not-allowed');
    try {
        let data;
        if (savedHistoryId) {
            try {
                data = await apiRequest(`/api/history/${savedHistoryId}`, {
                    method: 'PUT',
                    formData: buildProcessFormData()
                });
            } catch (err) {
                // Bản ghi đã bị xóa ở tab khác → tạo lại bản ghi mới thay vì báo lỗi
                if (err instanceof ApiError && err.status === 404) {
                    savedHistoryId = null;
                    data = await apiRequest('/api/history', {
                        method: 'POST',
                        formData: buildProcessFormData()
                    });
                } else {
                    throw err;
                }
            }
        } else {
            data = await apiRequest('/api/history', {
                method: 'POST',
                formData: buildProcessFormData()
            });
        }

        savedHistoryId = data.item?.id || savedHistoryId;
        updateSaveButtonUI();
        showNotification(data.message, 'success');
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
            renderAccountMenu(null);
        }
        showNotification(err.message, 'error');
    } finally {
        button.disabled = false;
        button.classList.remove('opacity-60', 'cursor-not-allowed');
    }
}

export async function initAccount() {
    const btnSave = document.getElementById('btn-save-history');
    if (btnSave) btnSave.addEventListener('click', () => saveToHistory(btnSave));

    try {
        await renderAccountMenu(await getCurrentUser());
    } catch {
        // Backend/MongoDB chưa sẵn sàng: Editor vẫn dùng được ở chế độ khách
        await renderAccountMenu(null);
    }
}
