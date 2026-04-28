import { formatBytes, formatDimensions, clamp } from '@/utils'

describe('formatBytes', () => {
  test('zero bytes', () => expect(formatBytes(0)).toBe('0 B'))
  test('bytes', () => expect(formatBytes(500)).toBe('500 B'))
  test('kilobytes', () => expect(formatBytes(1536)).toBe('1.5 KB'))
  test('megabytes', () => expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB'))
  test('large file', () => expect(formatBytes(20 * 1024 * 1024)).toBe('20 MB'))
})

describe('formatDimensions', () => {
  test('standard', () => expect(formatDimensions(1920, 1080)).toBe('1920×1080'))
  test('square', () => expect(formatDimensions(512, 512)).toBe('512×512'))
})

describe('clamp', () => {
  test('below min', () => expect(clamp(-5, 0, 100)).toBe(0))
  test('above max', () => expect(clamp(150, 0, 100)).toBe(100))
  test('within range', () => expect(clamp(50, 0, 100)).toBe(50))
  test('at boundary min', () => expect(clamp(0, 0, 100)).toBe(0))
  test('at boundary max', () => expect(clamp(100, 0, 100)).toBe(100))
})
