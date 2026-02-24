const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "Akses ditolak. Token tidak ditemukan." });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Format token salah." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; 
        next();
    } catch (error) {
        res.status(403).json({ success: false, message: "Token tidak valid atau kadaluarsa." });
    }
};

module.exports = { verifyToken };