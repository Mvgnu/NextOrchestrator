import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ContextService } from '@/lib/context-service'
import { ProjectService } from '@/lib/project-service'

interface ShareRequestBody {
  targetProjectId: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: { contextId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { contextId } = params
  const { targetProjectId } = (await req.json()) as ShareRequestBody
  if (!targetProjectId) {
    return NextResponse.json({ message: 'targetProjectId required' }, { status: 400 })
  }
  const hasAccess = await ContextService.userHasAccessToContext(
    session.user.id,
    contextId
  )
  if (!hasAccess) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  const projectAccess = await ProjectService.userHasAccessToProject(
    session.user.id,
    targetProjectId
  )
  if (!projectAccess) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  try {
    const context = await ContextService.shareContext(
      contextId,
      targetProjectId,
      session.user.id
    )
    return NextResponse.json({ context })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
