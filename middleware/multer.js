const multer = require('multer');
const path = require('path');

// Set up storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'assignment/'); // Store files in the 'assignment' folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Ensure unique filenames
  }
});

// Filter to only accept certain file types (e.g., PDFs, docs, etc.)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /pdf|doc|docx/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed!'));
  }
};

// Initialize multer with the defined storage and file filter
const upload_assign = multer({
  storage: storage,
  fileFilter: fileFilter
});

module.exports ={upload_assign}
