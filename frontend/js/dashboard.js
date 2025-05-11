// frontend/js/dashboard.js
import { apiFetch, showLoading, hideLoading, currentUser } from './main.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    // wait for auth
    for (let i = 0; i < 20 && currentUser === null; i++) {
        await new Promise(r => setTimeout(r, 50));
    }

    showLoading();
    try {
        const { totalEmployees, pendingLeaves, upcomingPayroll } =
            await apiFetch('/dashboard/summary');

        if (currentUser.role === 'admin') {
            document.getElementById('total-employees').textContent = totalEmployees;
            document.getElementById('link-tax')?.remove();
        } else {
            // employees don’t see org totals or the Employees/Payroll links
            document.getElementById('card-total-employees').style.display = 'none';
            document.getElementById('link-employees')?.remove();
            document.getElementById('link-payroll')?.remove();
        }

        document.getElementById('pending-leaves')
            .textContent = pendingLeaves;
        document.getElementById('upcoming-payroll')
            .textContent = `£${upcomingPayroll.toLocaleString()}`;

        // reminder two days before month-end
        const today = new Date(),
            year = today.getFullYear(),
            monthIndex = today.getMonth(),
            daysInMonth = new Date(year, monthIndex + 1, 0).getDate(),
            daysLeft = daysInMonth - today.getDate();

        if (daysLeft === 2 && upcomingPayroll > 0) {
            showToast(
                `Reminder: £${upcomingPayroll.toLocaleString()} payroll due in 2 days.`,
                5000
            );
        }

    } catch (err) {
        console.error('Dashboard load error:', err);
    } finally {
        hideLoading();
    }

    document.getElementById('logout-btn')
        .addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        });
});
