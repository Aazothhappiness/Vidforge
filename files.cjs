const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function saveBufferToUploads(buf, ext = '.png') {
  const name = `cached-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const filePath = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(filePath, buf);
  return `/uploads/${name}`;
}

module.exports = { saveBufferToUploads, UPLOAD_DIR };