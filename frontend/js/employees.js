// js/employees.js
import { apiFetch, showLoading, hideLoading } from './main.js';
import { showToast } from './toast.js';

const listEl = document.getElementById('employees-list');
const searchInput = document.getElementById('search-input');
const filterDept = document.getElementById('filter-dept');
const paginationEl = document.getElementById('pagination');
const addBtn = document.getElementById('add-employee-btn');

// modal elements
const modal = document.getElementById('confirm-modal');
const btnCancel = document.getElementById('confirm-cancel');
const btnOk = document.getElementById('confirm-ok');
let pendingDeleteId = null;

let allEmployees = [];
let meRole = '';
let currentPage = 1;
const pageSize = 8;

;
(async function init() {
    showLoading();
    try {
        const me = await apiFetch('/auth/me');
        meRole = me.data.user.role;
    } catch { meRole = ''; }
    if (meRole !== 'admin') addBtn.style.display = 'none';

    const resp = await apiFetch('/employees');
    allEmployees = Array.isArray(resp) ? resp : (resp.data || []);

    render();
    renderPagination();
}())
.finally(hideLoading);

// UI hooks
addBtn.addEventListener('click', () => {
    showLoading();
    location.href = 'employee.html';
});
searchInput.addEventListener('input', () => {
    currentPage = 1;
    render();
    renderPagination();
});
filterDept.addEventListener('change', () => {
    currentPage = 1;
    render();
    renderPagination();
});

// Event delegation for Edit/Delete
listEl.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.matches('.edit-btn')) {
        showLoading();
        location.href = `employee.html?id=${id}`;
    }
    if (btn.matches('.delete-btn')) {
        // open custom modal
        pendingDeleteId = id;
        openModal();
    }
});

// Modal handlers
btnCancel.addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

btnOk.addEventListener('click', () => {
  deleteEmployee(pendingDeleteId);
  closeModal();
});

// deletion
async function deleteEmployee(id) {
    showLoading();
    try {
        await apiFetch(`/employees/${id}`, { method: 'DELETE' });
        allEmployees = allEmployees.filter(e => e.id !== +id);
        render();
        renderPagination();
        showToast('Employee deleted', 2000);
    } catch (err) {
        showToast(err.message, 3000);
    } finally {
        hideLoading();
    }
}

// render/filter/pagination unchanged...
function getFiltered() {
    const q = searchInput.value.trim().toLowerCase();
    const dept = filterDept.value;
    return allEmployees.filter(e =>
        e.name.toLowerCase().includes(q) &&
        (dept ? e.department === dept : true)
    );
}

function render() {
    const items = getFiltered();
    const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    listEl.innerHTML = pageItems.map(e => `
    <div class="employee-card">
      <div class="employee-avatar">
        <img src="/public/images/employee.png" alt="Avatar" class="employee-icon"/>
      </div>
      <div class="employee-info">
        <h3 class="employee-name">${e.name}</h3>
        <p class="employee-email">${e.email}</p>
        <p class="employee-role"><strong>Role:</strong> ${e.role}</p>
        <p class="employee-dept"><strong>Dept:</strong> ${e.department || '-'}</p>
        <div class="card-actions">
          ${meRole==='admin' ? `
            <button class="btn-primary btn-sm edit-btn"   data-id="${e.id}">Edit</button>
            <button class="btn-secondary btn-sm delete-btn" data-id="${e.id}">Delete</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('') || '<p>No employees found.</p>';
}

function renderPagination() {
  const total = getFiltered().length;
  const pages = Math.ceil(total / pageSize);
  paginationEl.innerHTML = '';
  for (let i=1; i<=pages; i++){
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i===currentPage) btn.classList.add('active');
    btn.addEventListener('click', ()=>{
      currentPage=i; render(); renderPagination();
    });
    paginationEl.append(btn);
  }
}

// modal open/close
function openModal() {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
}
function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  pendingDeleteId = null;
}
