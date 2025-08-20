const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase() || '.bin';
    const name = `upl-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const allowed = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowed.has(file.mimetype)) cb(null, true);
    else cb(new Error('UNSUPPORTED_MIME:' + file.mimetype));
  }
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'NO_FILE_FIELD', message: 'Expecting form field "file"' });
  }
  const { filename, mimetype, size } = req.file;
  res.json({ ok: true, name: filename, mime: mimetype, size, url: `/uploads/${filename}` });
});

// unified error handler
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ ok: false, error: 'FILE_TOO_LARGE' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ ok: false, error: 'BAD_FIELD', message: 'Expecting field "file"' });
  if ((err.message || '').startsWith('UNSUPPORTED_MIME:')) {
    return res.status(415).json({ ok: false, error: 'UNSUPPORTED_TYPE', mime: err.message.split(':')[1] });
  }
  res.status(400).json({ ok: false, error: 'UPLOAD_FAILED', message: err.message });
});

module.exports = router;