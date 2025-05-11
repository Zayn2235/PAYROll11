// frontend/js/toast.js

export function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return console.warn('No toast container!');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    // begin fade‐out after `duration`
    setTimeout(() => toast.classList.add('fade-out'), duration);
    // remove after animation completes
    toast.addEventListener('animationend', () => toast.remove());
}