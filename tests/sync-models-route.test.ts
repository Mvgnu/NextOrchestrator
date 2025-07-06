import { NextRequest } from 'next/server'
import { POST as syncHandler } from '../app/api/admin/sync-models/route'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('../lib/auth', () => ({ auth: jest.fn() }))

jest.mock('../lib/model-management-service', () => ({
  ModelManagementService: {
    syncAllProvidersModels: jest.fn()
  }
}))

const { auth } = require('../lib/auth')
const { ModelManagementService } = require('../lib/model-management-service')

function createRequest() {
  return new NextRequest(new Request('http://localhost/api/admin/sync-models', { method: 'POST' }))
}

describe('admin sync models API', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('returns 401 if not authenticated', async () => {
    auth.mockResolvedValue(null)
    const res = await syncHandler(createRequest())
    expect(res.status).toBe(401)
  })

  test('returns 403 for non-admin user', async () => {
    auth.mockResolvedValue({ user: { id: 'user1', role: 'member' } })
    const res = await syncHandler(createRequest())
    expect(res.status).toBe(403)
  })

  test('triggers sync for admin user', async () => {
    auth.mockResolvedValue({ user: { id: 'admin1', role: 'admin' } })
    ModelManagementService.syncAllProvidersModels.mockResolvedValue([])

    const res = await syncHandler(createRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(ModelManagementService.syncAllProvidersModels).toHaveBeenCalled()
    expect(data).toEqual({ message: 'Model synchronization process initiated.', results: [] })
  })
})
