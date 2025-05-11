exports.success = (res, data = null, message = 'OK') => {
    res.json({ status: 'success', message, data });
};

exports.error = (res, code = 500, message = 'Internal Server Error') => {
    res.status(code).json({ status: 'error', message });
};