
describe('env helper functions', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXTAUTH_SECRET
    delete process.env.MAX_CONCURRENT_AGENTS
    delete process.env.OPENAI_API_KEY
    delete process.env.DB_SSL
  })

  test('hasRequiredEnvVars returns true when required vars set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
    process.env.NEXTAUTH_SECRET = 'secret'
    process.env.MAX_CONCURRENT_AGENTS = '5'
    const localEnv = require('../lib/env').env
    expect(localEnv.hasRequiredEnvVars()).toBe(true)
  })

  test('getApiKeyForProvider returns correct key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
    process.env.NEXTAUTH_SECRET = 'secret'
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.MAX_CONCURRENT_AGENTS = '5'
    const localEnv = require('../lib/env').env
    expect(localEnv.getApiKeyForProvider('openai')).toBe('openai-key')
  })

  test('dbSsl flag parses correctly', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
    process.env.NEXTAUTH_SECRET = 'secret'
    process.env.MAX_CONCURRENT_AGENTS = '5'
    process.env.DB_SSL = 'true'
    const localEnv = require('../lib/env').env
    expect(localEnv.dbSsl).toBe(true)
  })
})
