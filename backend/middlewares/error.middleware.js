// ─── backend/middlewares/error.middleware.js ────────────────────
exports.notFound = (req, res, next) => {
    res.status(404).json({ status: 'error', message: `Route ${req.originalUrl} not found` });
};

exports.errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err.stack || err);
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Server Error'
    });
};
