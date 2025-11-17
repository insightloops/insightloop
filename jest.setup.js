import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock File constructor for tests
global.File = class File extends Blob {
  constructor(chunks, filename, options = {}) {
    super(chunks, options)
    this.name = filename
    this.lastModified = Date.now()
  }
}
