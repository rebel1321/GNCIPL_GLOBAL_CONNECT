import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary storage for images and videos
const imageVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'global-connect/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg'],
    resource_type: 'auto', // This allows both images and videos
  },
});

// Configure Cloudinary storage for resume (PDF only)
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req) => ({
    folder: 'global-connect/resumes',
    resource_type: 'raw',
    format: 'pdf',
    public_id: `resume_${req.user.id}_${Date.now()}`
  })
});

// File filter function for images and videos only
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  
  const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// File filter function for PDF resume only
const resumeFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for resume upload'), false);
  }
};

// Create multer instances
const uploadMedia = multer({
  storage: imageVideoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for resumes (keeping same as frontend)
  }
});

// Custom storage that routes files to appropriate storage based on type
const customStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // We'll handle uploads manually to Cloudinary
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

// Combined upload middleware for posts with custom storage
const uploadPostFiles = multer({
  storage: customStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]);

export { uploadMedia, uploadResume, uploadPostFiles };
export default uploadMedia;