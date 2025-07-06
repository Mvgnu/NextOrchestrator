import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import OnboardingSteps from './OnboardingSteps'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) {
    redirect('/auth/signin')
  }
  return (
    <div className="container mx-auto py-10">
      <OnboardingSteps />
    </div>
  )
}
