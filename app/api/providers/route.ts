import { NextResponse } from 'next/server';
import { ModelManagementService } from '@/lib/model-management-service';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const providers = await ModelManagementService.getAllProviders();
    return NextResponse.json(providers);
  } catch (error: any) {
    console.error('[API_GET_PROVIDERS]', error);
    return NextResponse.json({ message: 'Error fetching providers', error: error.message }, { status: 500 });
  }
} 