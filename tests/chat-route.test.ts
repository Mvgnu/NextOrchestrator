import { NextRequest } from 'next/server';
import { POST as chatHandler } from '../app/api/projects/[id]/chat/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('../lib/auth', () => ({
  authOptions: {},
  auth: jest.fn()
}));

jest.mock('../lib/project-service', () => ({
  ProjectService: { userHasAccessToProject: jest.fn() }
}));

jest.mock('../lib/agent-service', () => ({
  AgentService: { getAgent: jest.fn() }
}));

jest.mock('../lib/context-service', () => ({
  ContextService: { getContextsByIds: jest.fn() }
}));

jest.mock('../app/services/synthesisService', () => ({
  synthesisService: { streamAgentTurn: jest.fn() }
}));

const { getServerSession } = require('next-auth');
const { ProjectService } = require('../lib/project-service');
const { AgentService } = require('../lib/agent-service');
const { ContextService } = require('../lib/context-service');
const { synthesisService } = require('../app/services/synthesisService');
const { auth } = require('../lib/auth');

function createRequest(body: any) {
  return new NextRequest(
    new Request('http://localhost/api/projects/1/chat', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    })
  );
}

describe('chat route access control', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns 401 when not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = createRequest({});
    const res = await chatHandler(req, { params: { id: 'proj1' } });
    expect(res.status).toBe(401);
  });

  test('returns 403 when user lacks project access', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user1' } });
    (ProjectService.userHasAccessToProject as jest.Mock).mockResolvedValue(false);
    const req = createRequest({});
    const res = await chatHandler(req, { params: { id: 'proj1' } });
    expect(res.status).toBe(403);
  });
});
