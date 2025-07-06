import { formatDate, timeAgo, truncateString, delay } from '@/lib/utils'
import { advanceTo, clear } from 'jest-date-mock'

describe('utils helpers', () => {
  afterEach(() => {
    clear()
    jest.useRealTimers()
  })

  test('formatDate returns formatted string', () => {
    const result = formatDate('2025-07-01T00:00:00.000Z')
    expect(result).toBe('Jul 1, 2025')
  })

  test('timeAgo returns relative time', () => {
    advanceTo(new Date('2025-07-10T00:00:00.000Z'))
    const result = timeAgo('2025-07-09T00:00:00.000Z')
    expect(result).toBe('1 day ago')
  })

  test('truncateString shortens long strings', () => {
    const str = 'hello world this is a really long string'
    expect(truncateString(str, 11)).toBe('hello world...')
  })

  test('delay waits specified ms', async () => {
    jest.useFakeTimers()
    const promise = delay(500)
    jest.advanceTimersByTime(500)
    await expect(promise).resolves.toBeUndefined()
  })
})
