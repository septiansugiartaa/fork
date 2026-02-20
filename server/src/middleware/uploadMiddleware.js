const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (subFolder, filePrefix = 'file') => {
    
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const dir = path.join('public/uploads/', subFolder); 
            
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: function (req, file, cb) {
            const userId = req.user ? req.user.id : 'guest';
            const uniqueSuffix = Date.now();
            
            cb(null, `${filePrefix}-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak didukung!'));
        }
    };

    return multer({ 
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: fileFilter
    });
};

module.exports = createUploader;