// ==========================================
// PROFILE PAGE - hồ sơ, ảnh đại diện, lịch sử chỉnh sửa, đổi mật khẩu
// ==========================================

import { apiRequest, fetchBlob, getCurrentUser, getInitials, logout } from '../modules/auth-client.js';
import { validateImageFile } from '../modules/config.js';
import { renderHistoryList, renderHistoryMessage } from '../modules/edit-history-view.js';
import { buildEditedFileName, downloadBlob } from '../modules/file-utils.js';
import { setButtonLoading, setFormMessage } from '../modules/form-utils.js';
import { showNotification } from '../modules/notifications.js';

const TABS = ['profile', 'history', 'settings'];
const HISTORY_PAGE_SIZE = 6;
const RECENT_HISTORY_SIZE = 2;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const PASSWORD_MIN_LENGTH = 6;

const $ = (id) => document.getElementById(id);

const state = {
    user: null,
    historyPage: 1,
    avatarUrl: ''
};

// Phiên hết hạn giữa chừng → quay về trang đăng nhập; lỗi khác → hiển thị thông báo
function handleApiError(err, messageElement) {
    if (err.status === 401) {
        showNotification(err.message, 'warning');
        setTimeout(() => window.location.replace('login.html?next=profile'), 1200);
        return;
    }
    if (messageElement) setFormMessage(messageElement, err.message);
    else showNotification(err.message, 'error');
}

// ---------- Hiển thị thông tin người dùng ----------

function renderUser(user, editCount) {
    state.user = user;
    $('profile-name').textContent = user.display_name;
    $('profile-avatar-fallback').textContent = getInitials(user.display_name);

    const since = new Date(user.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    $('profile-member-since').textContent = `Thành viên từ ${since}`;
    if (editCount !== undefined) {
        $('profile-edit-count').textContent = `${editCount} ảnh đã lưu`;
    }

    $('input-display-name').value = user.display_name;
    $('input-email').value = user.email;
    $('input-bio').value = user.bio || '';
    updateBioCounter();
}

async function renderAvatar(user) {
    const img = $('profile-avatar');
    const fallback = $('profile-avatar-fallback');
    if (state.avatarUrl) URL.revokeObjectURL(state.avatarUrl);
    state.avatarUrl = '';

    let showImage = false;
    if (user.has_avatar) {
        try {
            state.avatarUrl = URL.createObjectURL(await fetchBlob('/api/profile/avatar'));
            img.src = state.avatarUrl;
            showImage = true;
        } catch {
            // Không tải được ảnh: dùng chữ cái viết tắt
        }
    }
    img.classList.toggle('hidden', !showImage);
    fallback.classList.toggle('hidden', showImage);
}

function updateBioCounter() {
    $('bio-counter').textContent = `${$('input-bio').value.length}/300`;
}

async function refreshStats() {
    const data = await apiRequest('/api/profile');
    $('profile-edit-count').textContent = `${data.stats.edit_count} ảnh đã lưu`;
}

// ---------- Tabs ----------

function showTab(tab) {
    const active = TABS.includes(tab) ? tab : 'profile';
    document.querySelectorAll('.profile-tab').forEach((btn) => {
        const isActive = btn.dataset.tab === active;
        btn.classList.toggle('bg-gray-800', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('font-medium', isActive);
        btn.classList.toggle('text-gray-400', !isActive);
        btn.classList.toggle('hover:bg-gray-800/50', !isActive);
        btn.setAttribute('aria-selected', String(isActive));
    });
    TABS.forEach((name) => $(`panel-${name}`).classList.toggle('hidden', name !== active));

    if (window.location.hash !== `#${active}`) {
        history.replaceState(null, '', `#${active}`);
    }
    if (active === 'history') loadHistoryPage(state.historyPage);
    if (active === 'profile') loadRecentHistory();
}

function initTabs() {
    document.querySelectorAll('.profile-tab, .profile-tab-link').forEach((btn) => {
        btn.addEventListener('click', () => showTab(btn.dataset.tab));
    });
    window.addEventListener('hashchange', () => showTab(window.location.hash.slice(1)));
}

// ---------- Lịch sử chỉnh sửa ----------

const historyHandlers = {
    async onDownload(item, button) {
        setButtonLoading(button, true, 'Đang tải...');
        try {
            const blob = await fetchBlob(item.image_url);
            downloadBlob(blob, buildEditedFileName(item.original_filename, item.mime_type));
        } catch (err) {
            handleApiError(err);
        } finally {
            setButtonLoading(button, false);
        }
    },

    async onDelete(item, button) {
        if (!window.confirm(`Xóa "${item.original_filename}" khỏi lịch sử? File ảnh đã lưu cũng sẽ bị xóa và không thể khôi phục.`)) {
            return;
        }
        button.disabled = true;
        try {
            const data = await apiRequest(`/api/history/${item.id}`, { method: 'DELETE' });
            showNotification(data.message, 'success');
            await Promise.all([reloadVisibleHistory(), refreshStats()]);
        } catch (err) {
            button.disabled = false;
            handleApiError(err);
        }
    }
};

async function fetchHistory(page, limit) {
    return apiRequest(`/api/history?page=${page}&limit=${limit}`);
}

async function loadRecentHistory() {
    const container = $('recent-history');
    try {
        const data = await fetchHistory(1, RECENT_HISTORY_SIZE);
        renderHistoryList(container, data.items, historyHandlers);
    } catch (err) {
        renderHistoryMessage(container, err.message);
        if (err.status === 401) handleApiError(err);
    }
}

async function loadHistoryPage(page) {
    const container = $('history-list');
    renderHistoryMessage(container, 'Đang tải lịch sử...');
    try {
        let data = await fetchHistory(page, HISTORY_PAGE_SIZE);
        const totalPages = Math.max(1, Math.ceil(data.total / HISTORY_PAGE_SIZE));
        // Trang hiện tại trống (vd. vừa xóa bản ghi cuối cùng của trang) → lùi về trang cuối hợp lệ
        if (!data.items.length && page > totalPages) {
            data = await fetchHistory(totalPages, HISTORY_PAGE_SIZE);
        }
        state.historyPage = data.page;
        renderHistoryList(container, data.items, historyHandlers);

        $('history-total').textContent = `${data.total} bản ghi`;
        $('history-pagination').classList.toggle('hidden', totalPages <= 1);
        $('history-page-info').textContent = `Trang ${data.page}/${totalPages}`;
        $('btn-history-prev').disabled = data.page <= 1;
        $('btn-history-next').disabled = data.page >= totalPages;
    } catch (err) {
        renderHistoryMessage(container, err.message);
        if (err.status === 401) handleApiError(err);
    }
}

function reloadVisibleHistory() {
    return $('panel-history').classList.contains('hidden')
        ? loadRecentHistory()
        : loadHistoryPage(state.historyPage);
}

function initHistoryPagination() {
    $('btn-history-prev').addEventListener('click', () => loadHistoryPage(state.historyPage - 1));
    $('btn-history-next').addEventListener('click', () => loadHistoryPage(state.historyPage + 1));
}

// ---------- Forms ----------

function initProfileForm() {
    const form = $('profile-form');
    const message = $('profile-message');
    const submitButton = $('btn-save-profile');
    $('input-bio').addEventListener('input', updateBioCounter);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const displayName = $('input-display-name').value.trim();
        if (displayName.length < 2 || displayName.length > 50) {
            setFormMessage(message, 'Tên hiển thị phải có từ 2 đến 50 ký tự.');
            return;
        }

        setFormMessage(message, '');
        setButtonLoading(submitButton, true, 'Đang lưu...');
        try {
            const data = await apiRequest('/api/profile', {
                method: 'PUT',
                json: { display_name: displayName, bio: $('input-bio').value }
            });
            renderUser(data.user);
            showNotification(data.message, 'success');
        } catch (err) {
            handleApiError(err, message);
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

function initPasswordForm() {
    const form = $('password-form');
    const message = $('password-message');
    const submitButton = $('btn-change-password');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const currentPassword = $('input-current-password').value;
        const newPassword = $('input-new-password').value;

        let error = '';
        if (!currentPassword) error = 'Vui lòng nhập mật khẩu hiện tại.';
        else if (newPassword.length < PASSWORD_MIN_LENGTH) error = `Mật khẩu mới phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`;
        else if (!newPassword.trim()) error = 'Mật khẩu mới không được chỉ gồm khoảng trắng.';
        else if (newPassword !== $('input-confirm-password').value) error = 'Mật khẩu xác nhận không khớp.';
        setFormMessage(message, error);
        if (error) return;

        setButtonLoading(submitButton, true, 'Đang cập nhật...');
        try {
            const data = await apiRequest('/api/profile/password', {
                method: 'PUT',
                json: { current_password: currentPassword, new_password: newPassword }
            });
            form.reset();
            setFormMessage(message, data.message, 'success');
            showNotification('Đổi mật khẩu thành công!', 'success');
        } catch (err) {
            handleApiError(err, message);
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

function initAvatarUpload() {
    const input = $('input-avatar');
    const button = $('btn-change-avatar');
    button.addEventListener('click', () => input.click());

    input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;

        const error = validateImageFile(file, MAX_AVATAR_BYTES);
        if (error) {
            showNotification(error, 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file, file.name);
        button.disabled = true;
        try {
            const data = await apiRequest('/api/profile/avatar', { method: 'POST', formData });
            state.user = data.user;
            await renderAvatar(data.user);
            showNotification(data.message, 'success');
        } catch (err) {
            handleApiError(err);
        } finally {
            button.disabled = false;
        }
    });
}

function initLogout() {
    $('btn-logout').addEventListener('click', async () => {
        try {
            await logout();
        } catch {
            // Token phía client đã được xóa; chuyển trang dù server không phản hồi
        }
        window.location.href = 'login.html';
    });
}

// ---------- Khởi tạo ----------

async function init() {
    let user;
    try {
        user = await getCurrentUser();
    } catch (err) {
        $('profile-loading-text').textContent = err.message;
        showNotification(err.message, 'error');
        return;
    }
    if (!user) {
        window.location.replace('login.html?next=profile');
        return;
    }

    initTabs();
    initHistoryPagination();
    initProfileForm();
    initPasswordForm();
    initAvatarUpload();
    initLogout();

    renderUser(user);
    renderAvatar(user);
    refreshStats().catch(handleApiError);

    $('profile-loading').classList.add('hidden');
    $('profile-content').classList.remove('hidden');
    showTab(window.location.hash.slice(1));
}

init();
