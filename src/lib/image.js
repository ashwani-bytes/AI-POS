/**
 * Fast client-side image compression using HTML5 Canvas.
 * Compresses large camera snapshots (e.g. 10MB) to ~350-500KB before uploading,
 * reducing network transfer from minutes to 1 second.
 */
export async function compressImage(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    // If not an image or already smaller than 600KB, use directly
    if (!file || !file.type.startsWith('image/') || file.size < 600 * 1024) {
      return resolve(file)
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxWidth) / height)
            height = maxWidth
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              return resolve(file)
            }
            const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressed)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = event.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
