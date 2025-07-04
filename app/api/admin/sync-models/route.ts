import { NextResponse } from 'next/server';
import { ModelManagementService } from '@/lib/model-management-service';
import { auth } from '@/lib/auth'; // Corrected path for auth

export async function POST(req: Request) {
  const session = await auth();

  // TODO: Implement proper admin role check
  // For now, just checking for authenticated user
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // Example admin check (if you add a role to your user session):
  // if (session.user.role !== 'admin') {
  //   return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  // }

  try {
    console.log('API route /admin/sync-models called');
    const results = await ModelManagementService.syncAllProvidersModels();
    console.log('Model sync process completed from API:', results);
    return NextResponse.json({ message: 'Model synchronization process initiated.', results });
  } catch (error: any) {
    console.error('[SYNC_MODELS_API]', error);
    return NextResponse.json({ message: 'Error during model synchronization', error: error.message }, { status: 500 });
  }
} 