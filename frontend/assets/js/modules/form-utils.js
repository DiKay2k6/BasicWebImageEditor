// ==========================================
// FORM HELPERS (dùng chung cho Login / Register / Profile)
// ==========================================

export function setButtonLoading(button, loading, loadingText = 'Đang xử lý...') {
    if (!button) return;
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
    } else if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
    }
    button.disabled = loading;
    button.classList.toggle('opacity-60', loading);
    button.classList.toggle('cursor-not-allowed', loading);
}

export function setFormMessage(element, message, type = 'error') {
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('hidden', !message);
    element.classList.toggle('text-red-400', type === 'error');
    element.classList.toggle('text-green-400', type === 'success');
}

// Chỉ cho phép chuyển hướng tới các trang nội bộ đã biết (chống open-redirect qua ?next=)
const REDIRECT_TARGETS = {
    editor: '../index.html',
    profile: 'profile.html'
};

export function getRedirectTarget() {
    const next = new URLSearchParams(window.location.search).get('next');
    return REDIRECT_TARGETS[next] || REDIRECT_TARGETS.editor;
}

export function withNextParam(page) {
    const next = new URLSearchParams(window.location.search).get('next');
    return next && REDIRECT_TARGETS[next] ? `${page}?next=${next}` : page;
}
