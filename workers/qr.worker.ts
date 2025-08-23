// QR decoding worker for heavy processing
import { BrowserQRCodeReader } from '@zxing/library'

const qrReader = new BrowserQRCodeReader()

self.onmessage = async (event) => {
  const { type, data } = event.data

  try {
    switch (type) {
      case 'DECODE_QR':
        const { imageData } = data
        const result = await qrReader.decodeFromImageData(imageData)
        
        self.postMessage({
          type: 'QR_DECODED',
          success: true,
          data: { text: result.getText() }
        })
        break

      case 'DECODE_QR_FROM_CANVAS':
        const { canvas } = data
        const canvasResult = await qrReader.decodeFromCanvas(canvas)
        
        self.postMessage({
          type: 'QR_DECODED',
          success: true,
          data: { text: canvasResult.getText() }
        })
        break

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    self.postMessage({
      type: 'QR_DECODE_ERROR',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Export empty object to make this a module
export {}