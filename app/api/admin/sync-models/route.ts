import { NextResponse } from 'next/server'
import { ModelManagementService } from '@/lib/model-management-service'
import { auth } from '@/lib/auth' // Corrected path for auth
import logger from '@/lib/logger'

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    logger.warn(
      `User ${session.user.id} (role: ${session.user.role}) attempted model sync.`
    )
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    logger.info('API route /admin/sync-models called')
    const results = await ModelManagementService.syncAllProvidersModels();
    logger.info({ results }, 'Model sync process completed from API')
    return NextResponse.json({ message: 'Model synchronization process initiated.', results });
  } catch (error: any) {
    logger.error({ error }, '[SYNC_MODELS_API]')
    return NextResponse.json({ message: 'Error during model synchronization', error: error.message }, { status: 500 });
  }
} 