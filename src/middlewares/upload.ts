import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files are saved to the uploads directory in the root
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp and a random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only images
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const csvFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();
  
  const isCsv =
    ext === '.csv' ||
    mimetype === 'text/csv' ||
    mimetype === 'application/vnd.ms-excel' ||
    mimetype === 'text/plain' ||
    mimetype === 'application/csv' ||
    mimetype === 'text/x-csv' ||
    mimetype === 'application/x-csv' ||
    mimetype === 'text/comma-separated-values' ||
    mimetype === 'application/octet-stream';

  if (isCsv) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files (.csv) are allowed!'), false);
  }
};

export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for CSV
});
