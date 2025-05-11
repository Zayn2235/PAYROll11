// frontend/js/profile.js
import { apiFetch } from './main.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', async() => {
    const token = localStorage.getItem('authToken');
    if (!token) return window.location.href = 'login.html';

    // Element refs
    const nameInput = document.getElementById('admin-name');
    const emailInput = document.getElementById('admin-email');
    const bannerName = document.getElementById('welcome-name');
    const saveBtn = document.getElementById('save-profile');
    const form = document.getElementById('profile-form');

    // Load profile once and populate
    async function loadProfile() {
        try {
            const resp = await apiFetch('/auth/me', { method: 'GET' });
            const user = resp.data.user;
            nameInput.value = user.name;
            emailInput.value = user.email;
            bannerName.textContent = user.name;
        } catch (err) {
            console.error(err);
            if (err.message.includes('401')) {
                localStorage.removeItem('authToken');
                return window.location.href = 'login.html';
            }
            showToast('Cannot fetch profile details', 3000);
        }
    }

    await loadProfile();

    // Save updated name/email
    saveBtn.addEventListener('click', async() => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        if (!name || !email) {
            return showToast('Name & email cannot be empty', 3000);
        }

        // Optimistically update banner immediately
        bannerName.textContent = name;

        try {
            const { message, data } = await apiFetch('/admin/update-profile', {
                method: 'POST',
                body: { name, email }
            });
            // Immediately reflect the confirmed values
            nameInput.value = data.name;
            emailInput.value = data.email;
            bannerName.textContent = data.name;

            showToast(message || 'Profile updated', 2000);
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Could not update profile', 3000);
            // on error, reload old values
            await loadProfile();
        }
    });

    // Password toggle (unchanged)
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            const isPwd = target.type === 'password';
            target.type = isPwd ? 'text' : 'password';
            btn.textContent = isPwd ? 'Hide' : 'Show';
        });
    });

    // Handle change‐password (unchanged)
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const current = form.currentPassword.value;
        const next = form.newPassword.value;
        const confirm = form.confirmPassword.value;
        if (next !== confirm) {
            return showToast('New passwords do not match', 3000);
        }
        try {
            const { message } = await apiFetch('/admin/change-password', {
                method: 'POST',
                body: { currentPassword: current, newPassword: next }
            });
            showToast(message, 3000);
            form.reset();
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Password change failed', 3000);
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        });
    }
});