export class ImageTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super('image_too_large')
    this.name = 'ImageTooLargeError'
  }
}

export function readFileAsDataUrl(file: File, maxBytes: number): Promise<string> {
  if (file.size > maxBytes) {
    return Promise.reject(new ImageTooLargeError(maxBytes))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('read_failed'))
    reader.readAsDataURL(file)
  })
}
