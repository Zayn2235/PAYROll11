// frontend/js/payment.js
import { apiFetch, currentUser } from './main.js';
import { showToast } from './toast.js';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Dept→Roles map (admins only)
const departmentRoles = {
    backend: ['Backend Developer', 'Database Admin', 'API Engineer'],
    frontend: ['Frontend Developer', 'UI Engineer', 'Accessibility Specialist'],
    devops: ['DevOps Engineer', 'Release Manager', 'SRE'],
    qa: ['QA Engineer', 'Test Automation Engineer', 'Manual Tester'],
    product: ['Product Manager', 'Associate PM', 'Product Owner'],
    design: ['UX Designer', 'UI Designer', 'Interaction Designer'],
    data: ['Data Scientist', 'Data Analyst', 'ML Engineer'],
    finance: ['Accountant', 'Financial Analyst', 'Controller'],
    sales: ['Sales Exec', 'Marketing Manager', 'BD Manager'],
    support: ['Support Specialist', 'CS Manager', 'Tech Support'],
    it: ['IT Support', 'SysAdmin', 'Network Admin'],
    training: ['Training Coordinator', 'L&D Specialist'],
    operations: ['Operations Manager', 'Supply Chain Analyst'],
    executive: ['CEO', 'COO', 'CTO', 'CFO']
};

async function initPayslips() {
    // 1) Reveal the filter bar
    document.getElementById('filter-bar').classList.remove('hidden');

    // 2) Show admin‐only inputs, if we’re an admin
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only')
            .forEach(el => el.style.display = 'flex');
        setupFilters();
    }

    // 3) First load
    await loadPayslips();
}

function setupFilters() {
    // dept → role cascade
    document.getElementById('filter-dept')
        .addEventListener('change', ev => {
            const roles = departmentRoles[ev.target.value] || [];
            const roleEl = document.getElementById('filter-role');
            roleEl.innerHTML = `<option value="">All Roles</option>` +
                roles.map(r => `<option value="${r}">${r}</option>`).join('');
            roleEl.disabled = roles.length === 0;
        });

    // re‐load on “Apply Filters”
    document.getElementById('apply-filters')
        .addEventListener('click', loadPayslips);
}

function getQueryParams() {
    const p = new URLSearchParams();

    // —— Always include month/year —— //
    const monthEl = document.getElementById('filter-month');
    if (monthEl && monthEl.value) p.set('month', monthEl.value);

    const yearEl = document.getElementById('filter-year');
    if (yearEl && yearEl.value) p.set('year', yearEl.value);

    // —— Name (all users can type their own name if you like) —— //
    const nameEl = document.getElementById('filter-name');
    if (nameEl && nameEl.value.trim()) {
        p.set('name', nameEl.value.trim());
    }

    // —— Dept & Role (admins only) —— //
    if (currentUser.role === 'admin') {
        const deptVal = document.getElementById('filter-dept').value;
        const roleVal = document.getElementById('filter-role').value;
        if (deptVal) p.set('department', deptVal);
        if (roleVal) p.set('role', roleVal);
    }

    return p.toString() ? `?${p}` : '';
}

async function loadPayslips() {
    const container = document.getElementById('payslips-list');
    container.innerHTML = '<p>Loading…</p>';

    try {
        const { data } = await apiFetch(`/payslips${getQueryParams()}`);
        if (!data.length) {
            container.innerHTML = '<p>No payslips found.</p>';
            return;
        }

        container.innerHTML = data.map(s => {
            const title = `${MONTH_NAMES[s.month - 1]} ${s.year}`;
            return `
        <div class="card">
          <h3>${title}</h3>
          <p class="employee-name">${s.name}</p>
          <p class="meta">${s.department} | ${s.role}</p>
          <p class="amount">£${s.amount.toLocaleString()}</p>
          <button
            class="btn btn-primary download-btn"
            data-id="${s.id}"
            data-title="${title}"
          >
            Download
          </button>
        </div>`;
        }).join('');

        document.querySelectorAll('.download-btn')
            .forEach(btn => btn.addEventListener('click', downloadPayslip));

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Error loading payslips.</p>';
        showToast('Could not load payslips', 3000);
    }
}

async function downloadPayslip(ev) {
    const btn = ev.currentTarget;
    const id = btn.dataset.id;
    const title = btn.dataset.title.replace(/\s+/g, '_');

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/payslips/${id}/download`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${title}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error('Download failed', err);
        showToast('Failed to download payslip', 3000);
    }
}

// wait for auth to finish
window.addEventListener('userFetched', initPayslips);