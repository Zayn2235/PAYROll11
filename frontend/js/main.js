// Base URL for all API calls
const API_BASE = '/api';

// Will hold the current user object once fetched
export let currentUser = null;
export { currentUser as CURRENT_USER };

/** Show a full-screen loading overlay */
export function showLoading() {
    if (!document.getElementById('loading-overlay')) {
        const ov = document.createElement('div');
        ov.id = 'loading-overlay';
        ov.innerHTML = `<div class="spinner"></div>`;
        document.body.appendChild(ov);
    }
}

/** Hide the loading overlay */
export function hideLoading() {
    const ov = document.getElementById('loading-overlay');
    if (ov) ov.remove();
}

/**
 * Generic API helper with Bearer token
 */
export async function apiFetch(endpoint, { method = 'GET', body = null } = {}) {
    const url = API_BASE + endpoint;
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };

    showLoading();
    const res = await fetch(url, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined
    });
    hideLoading();

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`HTTP ${res.status} ${method} ${url} →`, text);
        throw new Error(`API ${endpoint} failed: ${res.status}`);
    }
    return res.json();
}

/**
 * Hide or show nav links based on currentUser.role
 */
function updateHeaderNav() {
    if (!currentUser) return;

    // Admin: hide only Tax page link
    if (currentUser.role === 'admin') {
        const taxLink = document.querySelector('.main-nav a[href="tax.html"]');
        taxLink?.closest('li')?.remove();
    }
    // Employee: hide Employees & Payroll links
    else {
        document.querySelectorAll('.main-nav a').forEach(a => {
            const href = a.getAttribute('href');
            if (['employees.html', 'payroll.html'].includes(href)) {
                a.closest('li')?.remove();
            }
        });
    }
}

/**
 * On load, authenticate & then fire `userFetched`
 */
(async function initAuthAndNav() {
    const publicPaths = ['/login.html', '/index.html', '/'];
    if (publicPaths.some(p => location.pathname.endsWith(p))) {
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const json = await apiFetch('/auth/me');
        currentUser = json.data.user;
        window.dispatchEvent(new Event('userFetched'));
        updateHeaderNav();
    } catch {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }
})();
