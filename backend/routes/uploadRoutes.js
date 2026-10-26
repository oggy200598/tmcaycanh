const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

const targetDir = path.resolve(__dirname, '../../frontend/public/assets/images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e4);
    cb(null, `IMG_${uniqueSuffix}_${baseName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|svg/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName || mimeType) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận tệp hình ảnh (jpg, png, webp, gif)!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter,
});

/**
 * POST /api/upload
 * Nhận tệp hình ảnh, lưu vào frontend/public/assets/images/
 * Trả về đường dẫn chuẩn hóa /assets/images/<filename> để lưu vào Database
 */
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'Vui lòng chọn tệp hình ảnh để tải lên.',
        },
      });
    }

    const relativeUrl = `/assets/images/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: relativeUrl,
        fileName: req.file.filename,
        sizeBytes: req.file.size,
      },
      message: 'Tải hình ảnh lên thành công.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Lỗi xử lý tệp tải lên.',
      },
    });
  }
});

module.exports = router;
