import { apiFetch } from './main.js';
import { showToast } from './toast.js';

const params = new URLSearchParams(location.search);
const empId = params.get('id');
const form = document.getElementById('employee-form');
const titleEl = document.getElementById('form-title');
const deptSelect = document.getElementById('department');
const roleSelect = document.getElementById('role');

// loader overlay
const loaderOv = document.createElement('div');
loaderOv.className = 'loader-overlay';
loaderOv.innerHTML = '<div class="loader"></div>';
form.style.position = 'relative';
form.appendChild(loaderOv);

// department → roles mapping
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

function updateRoles(selected = '') {
    roleSelect.innerHTML = '<option value="">Select role…</option>';
    (departmentRoles[deptSelect.value] || []).forEach(r => {
        const o = new Option(r, r);
        if (r === selected) o.selected = true;
        roleSelect.add(o);
    });
}

deptSelect.addEventListener('change', () => updateRoles());

// init: load for editing
;
(async function init() {
    if (!empId) return;
    titleEl.textContent = 'Edit Employee';
    loaderOv.classList.add('active');
    try {
        const resp = await apiFetch(`/employees/${empId}`);
        const e = resp.data || resp;
        form.name.value = e.name;
        form.email.value = e.email;
        deptSelect.value = e.department;
        updateRoles(e.role);
    } catch (err) {
        showToast(err.message, 3000);
    } finally {
        loaderOv.classList.remove('active');
    }
})();

// handle form submit
form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        department: deptSelect.value,
        role: roleSelect.value
    };
    const url = empId ? `/employees/${empId}` : '/employees';
    const method = empId ? 'PUT' : 'POST';

    loaderOv.classList.add('active');
    try {
        const resp = await apiFetch(url, { method, body: payload });

        // Show default pwd on creation
        if (!empId && resp.defaultPassword) {
            showToast(`Created. Default password: ${resp.defaultPassword}`, 4000);
        } else {
            showToast('Employee saved', 2000);
        }
        setTimeout(() => location.href = 'employees.html', 1200);
    } catch (err) {
        showToast(err.message, 3000);
    } finally {
        loaderOv.classList.remove('active');
    }
});