import { apiFetch, currentUser } from './main.js';
import { showToast } from './toast.js';

// Dept → Roles mapping
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

async function loadSummary() {
    // 1) Available Funds
    try {
        const { data: { fund } } = await apiFetch('/payroll/fund');
        document.getElementById('available-funds')
            .textContent = `£${(+fund.amount || 0).toLocaleString()}`;
    } catch {
        document.getElementById('available-funds').textContent = '£0';
    }

    // 2) Payroll Summary
    try {
        const { data: { total, tax, net } } = await apiFetch('/payroll/summary');
        document.getElementById('total-payroll').textContent = `£${(+total).toLocaleString()}`;
        document.getElementById('tax-deductions').textContent = `£${(+tax).toLocaleString()}`;
        document.getElementById('net-pay').textContent = `£${(+net).toLocaleString()}`;
    } catch {
        showToast('Could not load payroll summary', 4000);
    }
}

function toggle(btnId, secId) {
    const b = document.getElementById(btnId),
        s = document.getElementById(secId);
    if (b && s) b.addEventListener('click', () => s.classList.toggle('hidden'));
}
function reset(id) { document.getElementById(id)?.reset(); }
function close(id) { document.getElementById(id)?.classList.add('hidden'); }

async function setupAdminUI() {
    if (!currentUser || currentUser.role !== 'admin') return;

    toggle('show-fund-btn', 'fund-section');
    toggle('show-dist-btn', 'distribute-section');

    // — Add Funds —
    document.getElementById('fund-form').addEventListener('submit', async e => {
        e.preventDefault();
        const amount = +document.getElementById('fund-amount').value;
        try {
            await apiFetch('/payroll/fund', { method: 'POST', body: { amount } });
            showToast('Funds saved!');
            reset('fund-form'); close('fund-section'); loadSummary();
        } catch {
            showToast('Error saving funds', 4000);
        }
    });

    // — Distribute Payroll Pool —
    const deptEl = document.getElementById('dist-dept'),
        roleEl = document.getElementById('dist-role');

    deptEl.addEventListener('change', () => {
        const opts = departmentRoles[deptEl.value] || [];
        roleEl.innerHTML = `<option value="">All Roles</option>`
            + opts.map(r => `<option value="${r}">${r}</option>`).join('');
        roleEl.disabled = !opts.length;
    });

    document.getElementById('distribute-form')
        .addEventListener('submit', async e => {
            e.preventDefault();
            const month = +document.getElementById('dist-month').value;
            const year = +document.getElementById('dist-year').value;
            const department = deptEl.value;
            const role = roleEl.value;

            try {
                await apiFetch('/payroll/distribute', {
                    method: 'POST',
                    body: { month, year, department, role }
                });
                showToast('Payroll pool distributed!');
                reset('distribute-form'); close('distribute-section');
                loadSummary();
            } catch {
                showToast('Error distributing payroll', 4000);
            }
        });
}

document.addEventListener('DOMContentLoaded', loadSummary);
window.addEventListener('userFetched', setupAdminUI);
