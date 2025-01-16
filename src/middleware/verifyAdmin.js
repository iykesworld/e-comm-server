const verifyAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return res.status(403).send({ success: false, message: 'Access denied, you are not allowed to perform this function' });
    }
    next();
};

module.exports = verifyAdmin;