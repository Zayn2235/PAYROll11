// controllers/payslip.controller.js
const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const { Payroll, Employee } = require('../models');
const { Op } = require('sequelize');

// GET /api/payslips
exports.list = asyncHandler(async(req, res) => {
    const { name, department, role, month, year } = req.query;

    // 1) Build payroll filter
    const payrollWhere = {};
    if (month) payrollWhere.month = month;
    if (year) payrollWhere.year = year;

    // 2) Build employee filter
    const empWhere = {};
    if (req.user.role === 'admin') {
        if (department) empWhere.department = department;
        if (role) empWhere.role = role;
        if (name) {
            // SQLite: no ILIKE, use LIKE (case-insensitive for ASCII)
            empWhere.name = {
                [Op.like]: `%${name}%` };
        }
    } else {
        // Employees only see their own
        const me = await Employee.findOne({ where: { email: req.user.email } });
        if (!me) return res.status(404).json({ status: 'error', message: 'Employee not found' });
        payrollWhere.employeeId = me.id;
    }

    // 3) Query with JOIN
    const recs = await Payroll.findAll({
        where: payrollWhere,
        include: [{
            model: Employee,
            as: 'employee',
            where: empWhere,
            attributes: ['name', 'department', 'role', 'email']
        }],
        order: [
            ['year', 'DESC'],
            ['month', 'DESC']
        ]
    });

    // 4) Map to minimal payslip list
    const slips = recs.map(r => ({
        id: r.id,
        month: r.month,
        year: r.year,
        amount: parseFloat(r.net),
        name: r.employee.name,
        department: r.employee.department,
        role: r.employee.role
    }));

    res.json({ data: slips });
});

// GET /api/payslips/:id/download  (unchanged)
exports.download = asyncHandler(async(req, res) => {
    const rec = await Payroll.findByPk(req.params.id, {
        include: [{ model: Employee, as: 'employee' }]
    });
    if (!rec) return res.status(404).json({ status: 'error', message: 'Payslip not found' });
    if (req.user.role !== 'admin' && rec.employee.email !== req.user.email) {
        return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="Payslip_${rec.month}_${rec.year}.pdf"`
    );
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc
        .fontSize(24).text('🏢 Cloud Payroll Ltd.', { align: 'center' })
        .moveDown()
        .fontSize(18).text(`Payslip for ${rec.month}/${rec.year}`, { align: 'center' })
        .moveDown(2)
        .fontSize(12)
        .text(`Employee : ${rec.employee.name}`)
        .text(`Email    : ${rec.employee.email}`)
        .text(`Dept.    : ${rec.employee.department || '—'}`)
        .text(`Role     : ${rec.employee.role || '—'}`)
        .moveDown()
        .text(`Gross Salary  : £${parseFloat(rec.gross).toLocaleString()}`)
        .text(`Tax Deduction : £${parseFloat(rec.tax).toLocaleString()}`)
        .text(`NI Deduction  : £${parseFloat(rec.ni).toLocaleString()}`)
        .moveDown()
        .fontSize(14).text(`Net Pay       : £${parseFloat(rec.net).toLocaleString()}`, { underline: true })
        .moveDown(2)
        .fontSize(10).fillColor('gray')
        .text('Thank you for your hard work!', { align: 'center' });

    doc.end();
});