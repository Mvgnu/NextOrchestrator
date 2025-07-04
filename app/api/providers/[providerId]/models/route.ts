import { NextResponse } from 'next/server';
import { ModelManagementService } from '@/lib/model-management-service';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: {
    providerId: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { providerId } = params;
  if (!providerId) {
    return NextResponse.json({ message: 'Provider ID is required' }, { status: 400 });
  }

  try {
    const models = await ModelManagementService.getModelsForProvider(providerId);
    return NextResponse.json(models);
  } catch (error: any) {
    console.error(`[API_GET_MODELS_FOR_PROVIDER ${providerId}]`, error);
    return NextResponse.json({ message: `Error fetching models for provider ${providerId}`, error: error.message }, { status: 500 });
  }
} 