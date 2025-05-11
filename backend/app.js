// backend/app.js
require('dotenv').config(); // ← load .env early
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const empRoutes = require('./routes/employee.routes');
const payrollRoutes = require('./routes/payroll.routes');
const leaveRoutes = require('./routes/leave.routes');
const taxRoutes = require('./routes/tax.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const payslipRoutes = require('./routes/payslip.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// ─── API ROUTES ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', empRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/payslips', payslipRoutes);

// ─── STATIC FILES & FALLBACK ─────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend', 'pages')));
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));
app.use('/public', express.static(path.join(__dirname, '..', 'frontend', 'public')));

app.get('/*.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', path.basename(req.path)));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html'));
});

// 404 / error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;