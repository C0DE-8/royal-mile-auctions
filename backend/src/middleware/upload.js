const fs = require('node:fs')
const path = require('node:path')
const multer = require('multer')

const uploadDir = path.join(__dirname, '..', '..', 'uploads')

fs.mkdirSync(path.join(uploadDir, 'auction-items'), { recursive: true })
fs.mkdirSync(path.join(uploadDir, 'wallet-qr'), { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, req.uploadFolder || 'auction-items'))
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-|-$/g, '')
    cb(null, `${Date.now()}-${safeName}`)
  },
})

const upload = multer({
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed.'))
      return
    }

    cb(null, true)
  },
  limits: { fileSize: 5 * 1024 * 1024 },
  storage,
})

function uploadTo(folder) {
  return (req, res, next) => {
    req.uploadFolder = folder
    next()
  }
}

module.exports = {
  upload,
  uploadDir,
  uploadTo,
}
