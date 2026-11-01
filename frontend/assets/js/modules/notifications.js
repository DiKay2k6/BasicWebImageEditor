// ==========================================
// NOTIFICATION SYSTEM (Toast)
// ==========================================

export function showNotification(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    let bgColor = 'bg-gray-800 border-gray-700 text-white';
    let icon = 'fa-info-circle text-blue-400';

    if (type === 'error') {
        bgColor = 'bg-red-900/90 border-red-700 text-white';
        icon = 'fa-exclamation-circle text-red-400';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-900/90 border-yellow-700 text-white';
        icon = 'fa-exclamation-triangle text-yellow-400';
    } else if (type === 'success') {
        bgColor = 'bg-green-900/90 border-green-700 text-white';
        icon = 'fa-check-circle text-green-400';
    }

    toast.className = `flex items-center p-4 min-w-[300px] border rounded-lg shadow-lg transform transition-all duration-300 translate-y-2 opacity-0 ${bgColor}`;
    toast.innerHTML = `
        <i class="fas ${icon} text-lg mr-3"></i>
        <div class="text-sm font-medium flex-1">${message}</div>
        <button class="ml-4 text-gray-400 hover:text-white focus:outline-none">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    const closeBtn = toast.querySelector('button');
    const removeToast = () => {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => toast.remove(), 300);
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', removeToast);
    }
    setTimeout(removeToast, 3500);
}
