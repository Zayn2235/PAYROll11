// frontend/js/tax.js
import { apiFetch, currentUser } from './main.js';
import { showToast } from './toast.js';

async function loadTaxSummary() {
    try {
        // Expect { data: { incomeTax, providentFund, totalDeductions, netReceived } }
        const resp = await apiFetch('/tax/summary');
        const {
            incomeTax = 0,
                providentFund = 0,
                totalDeductions = 0,
                netReceived = 0
        } = resp.data || {};

        document.getElementById('income-tax').textContent = `£${incomeTax.toLocaleString()}`;
        document.getElementById('provident-fund').textContent = `£${providentFund.toLocaleString()}`;
        document.getElementById('total-deductions').textContent = `£${totalDeductions.toLocaleString()}`;
        document.getElementById('net-received').textContent = `£${netReceived.toLocaleString()}`;
    } catch (err) {
        console.error('Failed to load tax summary', err);
        showToast('Could not load tax data', 4000);
    }
}

// On userFetched (once auth & role are known), load summary.
// Admins get redirected back to dashboard.
window.addEventListener('userFetched', async() => {
    if (!currentUser) return;
    if (currentUser.role === 'admin') {
        return window.location.replace('dashboard.html');
    }
    await loadTaxSummary();
});