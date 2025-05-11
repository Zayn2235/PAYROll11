import { apiFetch } from './main.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', () => {
    // 0) Redirect if already logged in
    if (localStorage.getItem('authToken')) {
        apiFetch('/auth/me')
            .then(r => {
                const u = r.data?.user;
                if (u) window.location.href = u.role === 'admin' ? 'profile.html' : 'dashboard.html';
            })
            .catch(() => localStorage.removeItem('authToken'));
    }

    // Tab switching
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-register');

    function showTab(isLogin) {
        tabLogin.setAttribute('aria-selected', isLogin);
        tabReg.setAttribute('aria-selected', !isLogin);
        formLogin.classList.toggle('active', isLogin);
        formReg.classList.toggle('active', !isLogin);
    }
    tabLogin.addEventListener('click', () => showTab(true));
    tabReg.addEventListener('click', () => showTab(false));
    showTab(true);

    // Password-show toggles
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const inp = btn.previousElementSibling;
            const show = inp.type === 'password';
            inp.type = show ? 'text' : 'password';
            btn.textContent = show ? 'Hide' : 'Show';
        });
    });

    // Loading helper
    function setLoading(btn, loading) {
        btn.classList.toggle('loading', loading);
        btn.disabled = loading;
    }

    // ─── LOGIN FLOW ───────────────────────────────────────────────────────────
    const loginSteps = Array.from(formLogin.querySelectorAll('.login-step'));
    function showLoginStep(step) {
        loginSteps.forEach(div => {
            div.hidden = div.dataset.step !== step;
            div.querySelectorAll('.otp-input,.reset-password')
                .forEach(el => el.hidden = true);
        });
    }
    formLogin.querySelectorAll('[data-action]').forEach(a => {
        a.addEventListener('click', ev => {
            ev.preventDefault();
            showLoginStep(a.dataset.action);
        });
    });
    showLoginStep('password');

    // 1) Password login
    formLogin.querySelector('button[type="submit"]')
        .addEventListener('click', async e => {
            e.preventDefault();
            const email = formLogin.email.value.trim();
            const pw = formLogin.password.value;
            if (!email || !pw) return showToast('Fill both fields', 3000);

            try {
                const { data } = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: { email, password: pw }
                });
                localStorage.setItem('authToken', data.token);
                showToast('Logged in!', 2000);
                setTimeout(() => {
                    window.location.href = data.role === 'admin' ? 'profile.html' : 'dashboard.html';
                }, 500);
            } catch (err) {
                showToast(err.message, 3000);
            }
        });

    // 2) OTP-login
    document.getElementById('send-otp-login')
        .addEventListener('click', async () => {
            const btn = document.getElementById('send-otp-login');
            const email = formLogin.otpEmail.value.trim();
            if (!email) return showToast('Enter email', 3000);

            setLoading(btn, true);
            try {
                await apiFetch('/auth/otp/login/request', {
                    method: 'POST',
                    body: { email }
                });
                showToast('OTP sent!', 2000);
                formLogin
                    .querySelector('.login-step[data-step="otp"] .otp-input')
                    .hidden = false;
            } catch (err) {
                showToast(err.message, 3000);
            } finally {
                setLoading(btn, false);
            }
        });
    document.getElementById('verify-otp-login')
        .addEventListener('click', async () => {
            const btn = document.getElementById('verify-otp-login');
            const email = formLogin.otpEmail.value.trim();
            const otp = formLogin.otpCode.value.trim();
            if (!otp) return showToast('Enter OTP', 3000);

            setLoading(btn, true);
            try {
                const { data } = await apiFetch('/auth/otp/login/verify', {
                    method: 'POST',
                    body: { email, otp }
                });
                localStorage.setItem('authToken', data.token);
                showToast('Verified!', 2000);
                setTimeout(() => {
                    window.location.href = data.role === 'admin' ? 'profile.html' : 'dashboard.html';
                }, 500);
            } catch (err) {
                showToast(err.message, 3000);
            } finally {
                setLoading(btn, false);
            }
        });

    // 3) Forgot-password OTP
    document.getElementById('send-otp-forgot')
        .addEventListener('click', async () => {
            const btn = document.getElementById('send-otp-forgot');
            const email = formLogin.forgotEmail.value.trim();
            if (!email) return showToast('Enter email', 3000);

            setLoading(btn, true);
            try {
                await apiFetch('/auth/forgot/request-otp', {
                    method: 'POST',
                    body: { email }
                });
                showToast('OTP sent!', 2000);
                formLogin
                    .querySelector('.login-step[data-step="forgot"] .otp-input')
                    .hidden = false;
            } catch (err) {
                showToast(err.message, 3000);
            } finally {
                setLoading(btn, false);
            }
        });
    document.getElementById('verify-otp-forgot')
        .addEventListener('click', async () => {
            const btn = document.getElementById('verify-otp-forgot');
            const email = formLogin.forgotEmail.value.trim();
            const otp = formLogin.forgotOtp.value.trim();
            if (!otp) return showToast('Enter OTP', 3000);

            setLoading(btn, true);
            try {
                await apiFetch('/auth/forgot/verify-otp', {
                    method: 'POST',
                    body: { email, otp }
                });
                showToast('Verified! Enter new password', 2000);
                formLogin
                    .querySelector('.login-step[data-step="forgot"] .reset-password')
                    .hidden = false;
            } catch (err) {
                showToast(err.message, 3000);
            } finally {
                setLoading(btn, false);
            }
        });
    document.getElementById('reset-password-btn')
        .addEventListener('click', async () => {
            const btn = document.getElementById('reset-password-btn');
            const email = formLogin.forgotEmail.value.trim();
            const pass = formLogin.newPassword.value;
            const confirm = formLogin.confirmPassword.value;

            if (!pass || pass !== confirm) {
                return showToast('Passwords must match', 3000);
            }

            setLoading(btn, true);
            try {
                await apiFetch('/auth/forgot/reset-password', {
                    method: 'POST',
                    body: { email, password: pass }
                });
                showToast('Password reset! Please log in.', 2000);

                // ←––→ AUTOMATICALLY SWITCH BACK TO LOGIN
                showTab(true);
                showLoginStep('password');
            } catch (err) {
                showToast(err.message, 3000);
            } finally {
                setLoading(btn, false);
            }
        });

    // ─── REGISTER FLOW ────────────────────────────────────────────────────────
    const regSteps = Array.from(formReg.querySelectorAll('.reg-step'));
    function showRegStep(step) {
        regSteps.forEach(div => div.hidden = div.dataset.regStep !== step);
    }
    formReg.querySelector('[data-action="login"]')
        .addEventListener('click', e => {
            e.preventDefault();
            showTab(true);
            showLoginStep('password');
        });
    showRegStep('email');

    // 1) Send register OTP
    document.getElementById('send-otp-register')
        .addEventListener('click', async () => {
            const btn = document.getElementById('send-otp-register');
            const name = formReg.regName.value.trim();
            const email = formReg.regEmail.value.trim();
            const role = formReg.regRole.value;
            if (!name || !email || !role) return showToast('All fields required', 3000);

            setLoading(btn, true);
            try {
                await apiFetch('/auth/otp/register/request', {
                    method: 'POST',
                    body: { name, email, role }
                });
                showToast('OTP sent!', 2000);
                showRegStep('otp');
            } catch (err) {
                showToast(err.message, 3000);
            } finally {
                setLoading(btn, false);
            }
        });

    // 2) Verify register OTP
    document.getElementById('verify-otp-register')
        .addEventListener('click', async () => {
            const btn = document.getElementById('verify-otp-register');
            const otp = formReg.regOtp.value.trim();
            if (!otp) return showToast('Enter OTP', 3000);

            setLoading(btn, true);
            try {
                await apiFetch('/auth/otp/register/verify', {
                    method: 'POST',
                    body: { email: formReg.regEmail.value, otp }
                });
                showToast('Verified! Now set password', 2000);
                showRegStep('password');
            } catch (err) {
                showToast(err.message, 3000);
            } finally {
                setLoading(btn, false);
            }
        });

    // 3) Set password
    document.getElementById('set-password-btn')
        .addEventListener('click', async () => {
            const btn = document.getElementById('set-password-btn');
            const pass = formReg.regPassword.value;
            const confirm = formReg.regConfirm.value;
            if (!pass || pass !== confirm) return showToast('Passwords must match', 3000);

            setLoading(btn, true);
            try {
                showToast('Password set! Enter security code', 2000);
                showRegStep('security');
            } finally {
                setLoading(btn, false);
            }
        });

    // 4) Final security & complete
    document.getElementById('verify-security-code')
        .addEventListener('click', async () => {
            const btn = document.getElementById('verify-security-code');
            const code = document.getElementById('reg-security-code').value.trim();
            const name = formReg.regName.value.trim();
            const email = formReg.regEmail.value.trim();
            const role = formReg.regRole.value;
            const password = formReg.regPassword.value;

            if (!code) return showToast('Enter security code', 3000);

            setLoading(btn, true);
            try {
                const { data } = await apiFetch('/auth/register/complete', {
                    method: 'POST',
                    body: { name, email, password, role, code }
                });
                localStorage.setItem('authToken', data.token);
                showToast('Registered & logged in!', 2000);
                setTimeout(() => window.location.href = 'dashboard.html', 500);
            } catch (err) {
                showToast(err.message, 3000);
            } finally {
                setLoading(btn, false);
            }
        });
});
