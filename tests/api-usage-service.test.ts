import { ApiUsageService } from '@/lib/api-usage-service'

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

const { query } = require('@/lib/db')

describe('ApiUsageService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('trackUsage inserts record and returns result', async () => {
    ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 'u1' }] })
    const usage = await ApiUsageService.trackUsage({
      user_id: 'u1',
      provider: 'openai',
      model: 'gpt-4',
      tokens_prompt: 5,
      tokens_completion: 10,
    })
    expect(query).toHaveBeenCalled()
    expect(usage.id).toBe('u1')
  })

  test('getUserDashboardStats aggregates totals', async () => {
    ;(query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ total_tokens: '15' }] })
      .mockResolvedValueOnce({ rows: [{ avg_rating: '4.2' }] })

    const res = await ApiUsageService.getUserDashboardStats(
      'u1',
      new Date('2025-07-01'),
      new Date('2025-07-02')
    )

    expect(res).toEqual({ total_tokens: 15, avg_rating: 4.2 })
  })
})
