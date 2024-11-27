import multer from 'multer';
import path from 'path';

// Set up Multer's storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the folder to store the uploaded files
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        // Generate a unique filename to avoid name clashes
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Use the original file extension
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Create an upload middleware using the Multer storage configuration
export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Set file size limit (5 MB for example)
    fileFilter: (req, file, cb) => {
        // Restrict file types (for example, only images)
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extname && mimeType) {
            return cb(null, true); // Accept the file
        } else {
            cb(new Error('Only image files are allowed!'), false); // Reject the file
        }
    }
});

