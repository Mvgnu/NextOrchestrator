import { AgentService } from '@/lib/agent-service'

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

const { query } = require('@/lib/db')

describe('AgentService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('createAgent inserts new agent and returns result', async () => {
    ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 'a1', name: 'Agent' }] })
    const agent = await AgentService.createAgent({
      user_id: 'u1',
      project_id: 'p1',
      name: 'Agent',
    })
    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'u1',
      'p1',
      'Agent',
      null,
      null,
      {},
      false,
    ])
    expect(agent.id).toBe('a1')
  })

  test('updateAgent returns updated agent', async () => {
    ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 'a1', name: 'New' }] })
    const agent = await AgentService.updateAgent('a1', 'u1', { name: 'New' })
    expect(query).toHaveBeenCalled()
    const values = (query as jest.Mock).mock.calls[0][1]
    expect(values).toContain('New')
    expect(agent?.name).toBe('New')
  })

  test('deleteAgent returns true when row deleted', async () => {
    ;(query as jest.Mock).mockResolvedValue({ rowCount: 1 })
    const result = await AgentService.deleteAgent('a1', 'p1', 'u1')
    expect(query).toHaveBeenCalledWith(expect.any(String), ['a1', 'p1', 'u1'])
    expect(result).toBe(true)
  })

  test('userHasAccessToAgent returns false on db error', async () => {
    ;(query as jest.Mock).mockRejectedValue(new Error('db failure'))
    const result = await AgentService.userHasAccessToAgent('u1', 'a1')
    expect(result).toBe(false)
  })
})
