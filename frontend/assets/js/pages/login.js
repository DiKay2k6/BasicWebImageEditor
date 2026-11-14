// ==========================================
// LOGIN PAGE
// ==========================================

import { getCurrentUser, login } from '../modules/auth-client.js';
import { getRedirectTarget, setButtonLoading, setFormMessage, withNextParam } from '../modules/form-utils.js';
import { showNotification } from '../modules/notifications.js';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const submitButton = document.getElementById('btn-login');
const messageBox = document.getElementById('login-message');

document.getElementById('link-register').href = withNextParam('register.html');

document.getElementById('btn-forgot-password').addEventListener('click', () => {
    showNotification('Chức năng khôi phục mật khẩu chưa được hỗ trợ trong phiên bản này.', 'info');
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFormMessage(messageBox, '');

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
        setFormMessage(messageBox, 'Vui lòng nhập đầy đủ email và mật khẩu.');
        return;
    }
    if (!emailInput.checkValidity()) {
        setFormMessage(messageBox, 'Email không đúng định dạng.');
        emailInput.focus();
        return;
    }

    setButtonLoading(submitButton, true, 'Đang đăng nhập...');
    try {
        await login(email, password);
        window.location.href = getRedirectTarget();
    } catch (err) {
        setFormMessage(messageBox, err.message);
        // Chỉ xóa mật khẩu khi sai thông tin đăng nhập, không xóa khi lỗi kết nối/định dạng
        if (err.status === 401) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        setButtonLoading(submitButton, false);
    }
});

// Đã đăng nhập thì không cần ở lại trang Login
getCurrentUser()
    .then((user) => {
        if (user) window.location.replace(getRedirectTarget());
    })
    .catch(() => {
        // Backend chưa chạy: vẫn hiển thị form, lỗi sẽ được báo khi người dùng gửi form
    });
