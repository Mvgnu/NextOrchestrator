import { NextRequest } from 'next/server';
import { POST as shareHandler } from '../app/api/contexts/[id]/share/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('../lib/auth', () => ({ authOptions: {} }));

jest.mock('../lib/context-service', () => ({
  ContextService: {
    userHasAccessToContext: jest.fn(),
    shareContext: jest.fn()
  }
}));

jest.mock('../lib/project-service', () => ({
  ProjectService: {
    userHasAccessToProject: jest.fn()
  }
}));

const { getServerSession } = require('next-auth');
const { ContextService } = require('../lib/context-service');
const { ProjectService } = require('../lib/project-service');

function createRequest(body: any) {
  return new NextRequest(
    new Request('http://localhost/api/contexts/1/share', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    })
  );
}

describe('share context API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = createRequest({ targetProjectId: 'proj2' });
    const res = await shareHandler(req, { params: { contextId: 'ctx1' } });
    expect(res.status).toBe(401);
  });

  test('shares context when authorized', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } });
    (ContextService.userHasAccessToContext as jest.Mock).mockResolvedValue(true);
    (ProjectService.userHasAccessToProject as jest.Mock).mockResolvedValue(true);
    (ContextService.shareContext as jest.Mock).mockResolvedValue({ id: 'newCtx' });

    const req = createRequest({ targetProjectId: 'proj2' });
    const res = await shareHandler(req, { params: { contextId: 'ctx1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(ProjectService.userHasAccessToProject).toHaveBeenCalledWith('user1', 'proj2');
    expect(ContextService.shareContext).toHaveBeenCalledWith('ctx1', 'proj2', 'user1');
    expect(data).toEqual({ context: { id: 'newCtx' } });
  });
});
