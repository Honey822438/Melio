import multer, { FileFilterCallback } from 'multer'
import { Request } from 'express'

// Store in memory — we stream directly to Supabase Storage, no disk writes
const storage = multer.memoryStorage()

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'))
  }
}

// Max 5MB per image, up to 5 images per product
export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,
  },
}).array('images', 5)
