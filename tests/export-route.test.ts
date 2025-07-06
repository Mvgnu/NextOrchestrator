import { NextRequest } from 'next/server';
import { POST as exportHandler } from '../app/api/contexts/[id]/export/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('../lib/auth', () => ({ authOptions: {} }));

jest.mock('../lib/context-service', () => ({
  ContextService: {
    userHasAccessToContext: jest.fn(),
    getContext: jest.fn()
  }
}));

const { getServerSession } = require('next-auth');
const { ContextService } = require('../lib/context-service');

function createRequest(format: string) {
  return new NextRequest(
    new Request('http://localhost/api/contexts/1/export', {
      method: 'POST',
      body: JSON.stringify({ format }),
      headers: { 'Content-Type': 'application/json' }
    })
  );
}

describe('export context API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await exportHandler(createRequest('markdown'), { params: { contextId: 'ctx1' } });
    expect(res.status).toBe(401);
  });

  test('exports markdown when authorized', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } });
    (ContextService.userHasAccessToContext as jest.Mock).mockResolvedValue(true);
    (ContextService.getContext as jest.Mock).mockResolvedValue({
      name: 'Test',
      metadata: {},
      content: 'hello'
    });

    const res = await exportHandler(createRequest('markdown'), { params: { contextId: 'ctx1' } });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.filename).toBe('Test.md');
  });
});
