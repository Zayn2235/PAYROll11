import { apiFetch, CURRENT_USER } from './main.js';
import { showToast } from './toast.js';

const formSection = document.getElementById('leave-form-section');
const form = document.getElementById('leave-form');
const titleEl = document.getElementById('requests-title');
const container = document.getElementById('requests-container');
const modal = document.getElementById('leave-modal');
const modalBody = document.getElementById('modal-body');
const adminActions = document.getElementById('admin-actions');
const noteInput = document.getElementById('admin-note');
const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');
let currentRequestId = null;

// 1) Prevent selecting past dates
function disablePastDates() {
    const today = new Date().toISOString().split('T')[0];
    form.startDate.setAttribute('min', today);
    form.endDate.setAttribute('min', today);
}

// 2) Wait until CURRENT_USER is populated
async function waitForUser() {
    while (CURRENT_USER === null) {
        await new Promise(r => setTimeout(r, 50));
    }
}

// 3) Render leave-request cards
function renderRequests(reqs) {
    container.innerHTML = '';
    reqs.forEach(r => {
        const card = document.createElement('div');
        card.className = `request-card ${r.status}`;
        card.innerHTML = `
      <h4>${r.startDate} → ${r.endDate}</h4>
      <p>${r.reason}</p>
      <small>Status: ${r.status.toUpperCase()}</small>
    `;
        card.onclick = () => openModal(r);
        container.appendChild(card);
    });
}

// 4a) Employee loads their own requests
async function loadMyRequests() {
    const { data } = await apiFetch('/leave/mine');
    titleEl.textContent = 'My Requests';
    renderRequests(data);
}

// 4b) Admin loads all pending requests
async function loadPendingRequests() {
    const { data } = await apiFetch('/leave/pending');
    titleEl.textContent = 'Pending Requests';
    renderRequests(data);
}

// 5) Open modal
function openModal(r) {
    currentRequestId = r.id;
    modalBody.innerHTML = `
    <p><strong>From:</strong> ${r.startDate}</p>
    <p><strong>To:</strong>   ${r.endDate}</p>
    <p><strong>Reason:</strong> ${r.reason}</p>
    <p><strong>Status:</strong> ${r.status}</p>
    ${r.adminNote ? `<p><strong>Note:</strong> ${r.adminNote}</p>` : ''}
  `;
  adminActions.classList.toggle(
    'hidden',
    !(CURRENT_USER.role === 'admin' && r.status === 'pending')
  );
  modal.classList.remove('hidden');
}

// 6) Close modal
modal.querySelector('.modal-close').onclick = () => {
  modal.classList.add('hidden');
  noteInput.value = '';
};

// 7) Handle employee apply
async function handleApply(e) {
  e.preventDefault();
  // extra client-side guard
  const { startDate, endDate, reason } = form;
  if (startDate.value < startDate.min || endDate.value < endDate.min) {
    return showToast('Please select today or a future date', 3000);
  }
  const payload = {
    startDate: startDate.value,
    endDate:   endDate.value,
    reason:    reason.value.trim()
  };
  try {
    await apiFetch('/leave/apply', { method:'POST', body: payload });
    showToast('Leave requested', 2000);
    form.reset();
    await loadMyRequests();
  } catch (err) {
    showToast(`Error: ${err.message}`, 3000);
  }
}

// 8) Admin decide
async function decide(status) {
  try {
    await apiFetch(`/leave/decide/${currentRequestId}`, {
      method: 'POST',
      body: { status, adminNote: noteInput.value.trim() }
    });
    showToast(`Leave ${status}`, 2000);
    modal.classList.add('hidden');
    noteInput.value = '';
    await loadPendingRequests();
  } catch (err) {
    showToast(`Error: ${err.message}`, 3000);
  }
}
approveBtn.onclick = () => decide('approved');
rejectBtn.onclick  = () => decide('rejected');

// 9) Init
(async function initLeavePage() {
  await waitForUser();

  // Prevent past‐date selection
  disablePastDates();

  if (CURRENT_USER.role === 'admin') {
    formSection.style.display = 'none';
    await loadPendingRequests();
  } else {
    formSection.style.display = '';
    await loadMyRequests();
    form.addEventListener('submit', handleApply);
  }
})();