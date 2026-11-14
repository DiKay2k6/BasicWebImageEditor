// ==========================================
// NOTIFICATION SYSTEM (Toast)
// ==========================================

const MAX_VISIBLE_TOASTS = 4;
const TOAST_STYLES = {
    info: { color: 'bg-gray-800 border-gray-700 text-white', icon: 'fa-info-circle text-blue-400', duration: 3500 },
    success: { color: 'bg-green-900/90 border-green-700 text-white', icon: 'fa-check-circle text-green-400', duration: 3500 },
    warning: { color: 'bg-yellow-900/90 border-yellow-700 text-white', icon: 'fa-exclamation-triangle text-yellow-400', duration: 4500 },
    error: { color: 'bg-red-900/90 border-red-700 text-white', icon: 'fa-exclamation-circle text-red-400', duration: 6000 }
};

function getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-[calc(100vw-2.5rem)]';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }
    return container;
}

export function showNotification(message, type = 'info') {
    const style = TOAST_STYLES[type] || TOAST_STYLES.info;
    const container = getContainer();

    // Không hiển thị lặp lại cùng một thông báo đang hiện
    const duplicate = [...container.children].find(
        (toast) => toast.dataset.message === message && !toast.dataset.closing
    );
    if (duplicate) return;

    while (container.children.length >= MAX_VISIBLE_TOASTS) {
        container.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.dataset.message = message;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.className = `flex items-center p-4 min-w-[300px] border rounded-lg shadow-lg transform transition-all duration-300 translate-y-2 opacity-0 ${style.color}`;

    const icon = document.createElement('i');
    icon.className = `fas ${style.icon} text-lg mr-3`;

    // Dùng textContent (không dùng innerHTML) để thông báo từ server không thể chèn HTML/script
    const text = document.createElement('div');
    text.className = 'text-sm font-medium flex-1';
    text.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ml-4 text-gray-400 hover:text-white focus:outline-none';
    closeBtn.setAttribute('aria-label', 'Đóng thông báo');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';

    toast.append(icon, text, closeBtn);
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));

    const removeToast = () => {
        if (toast.dataset.closing) return;
        toast.dataset.closing = 'true';
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => toast.remove(), 300);
    };
    closeBtn.addEventListener('click', removeToast);
    setTimeout(removeToast, style.duration);
}
