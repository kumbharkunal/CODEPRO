import express from 'express';
import multer from 'multer';
import { uploadProfileImage } from '../controllers/uploadcontroller';
import { authenticateClerk } from '../middlewares/auth';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/upload/profile-image - Upload profile image
router.post(
  '/profile-image',
  authenticateClerk,
  upload.single('image'),
  uploadProfileImage
);

export default router;