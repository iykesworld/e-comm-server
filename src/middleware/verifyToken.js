const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET_KEY;

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if(!token){
            return res.status(403).json({message: 'Access denied, no token provided.'});
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if(!decoded){
            return res.status(403).json({message: 'Access denied, invalid token.'});
        }
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    } catch (error) {
        console.error(error, 'Error while verifying token');
       res.status(500).json({message: 'Server error, could not verify token.'}); 
    }
};

module.exports = verifyToken;