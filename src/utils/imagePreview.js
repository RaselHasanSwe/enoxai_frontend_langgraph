const PREVIEW_MAX_DIMENSION = 128
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export function validateImageFile(file) {
  if (!file) {
    throw new Error('No image selected.')
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Please upload a JPG, PNG, WEBP, or GIF image.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be smaller than 10 MB.')
  }
  return file
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getClipboardImageFile(clipboardData) {
  if (!clipboardData?.items) return null

  for (const item of clipboardData.items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }

  return null
}

export async function createThumbnailPreview(file, maxDimension = PREVIEW_MAX_DIMENSION) {
  validateImageFile(file)

  if (typeof createImageBitmap !== 'function') {
    return URL.createObjectURL(file)
  }

  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  const targetW = Math.max(1, Math.round(width * scale))
  const targetH = Math.max(1, Math.round(height * scale))
  bitmap.close()

  const resized = await createImageBitmap(file, {
    resizeWidth: targetW,
    resizeHeight: targetH,
    resizeQuality: 'medium',
  })

  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(targetW, targetH)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(resized, 0, 0)
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
      return URL.createObjectURL(blob)
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    canvas.getContext('2d').drawImage(resized, 0, 0)

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Preview failed'))
        else resolve(URL.createObjectURL(blob))
      }, 'image/jpeg', 0.85)
    })
  } finally {
    resized.close()
  }
}
