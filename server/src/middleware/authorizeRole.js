    const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Akses ditolak. Role tidak diizinkan."
        });
        }
        next();
    };
    };

    module.exports = authorizeRole;