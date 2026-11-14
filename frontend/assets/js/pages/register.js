// ==========================================
// REGISTER PAGE
// ==========================================

import { getCurrentUser, register } from '../modules/auth-client.js';
import { getRedirectTarget, setButtonLoading, setFormMessage, withNextParam } from '../modules/form-utils.js';
import { showNotification } from '../modules/notifications.js';

const PASSWORD_MIN_LENGTH = 6;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;

const form = document.getElementById('register-form');
const nameInput = document.getElementById('register-name');
const emailInput = document.getElementById('register-email');
const passwordInput = document.getElementById('register-password');
const confirmInput = document.getElementById('register-confirm');
const submitButton = document.getElementById('btn-register');
const messageBox = document.getElementById('register-message');

document.getElementById('link-login').href = withNextParam('login.html');

function validateForm() {
    const name = nameInput.value.trim();
    if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
        return `Tên hiển thị phải có từ ${NAME_MIN_LENGTH} đến ${NAME_MAX_LENGTH} ký tự.`;
    }
    if (!emailInput.value.trim() || !emailInput.checkValidity()) {
        return 'Email không đúng định dạng.';
    }
    if (passwordInput.value.length < PASSWORD_MIN_LENGTH) {
        return `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`;
    }
    if (!passwordInput.value.trim()) {
        return 'Mật khẩu không được chỉ gồm khoảng trắng.';
    }
    if (passwordInput.value !== confirmInput.value) {
        return 'Mật khẩu xác nhận không khớp.';
    }
    return '';
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = validateForm();
    setFormMessage(messageBox, error);
    if (error) return;

    setButtonLoading(submitButton, true, 'Đang tạo tài khoản...');
    try {
        const user = await register(nameInput.value.trim(), emailInput.value.trim(), passwordInput.value);
        showNotification(`Chào mừng ${user.display_name}! Tài khoản đã được tạo.`, 'success');
        setTimeout(() => { window.location.href = getRedirectTarget(); }, 800);
    } catch (err) {
        setFormMessage(messageBox, err.message);
        setButtonLoading(submitButton, false);
    }
});

getCurrentUser()
    .then((user) => {
        if (user) window.location.replace(getRedirectTarget());
    })
    .catch(() => {
        // Backend chưa chạy: lỗi sẽ được báo khi gửi form
    });
