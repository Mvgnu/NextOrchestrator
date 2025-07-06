'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckIcon } from '@radix-ui/react-icons'

/**
 * purpose: Interactive onboarding flow guiding new users through initial setup
 * status: stable
 * inputs: none
 * outputs: step-based UI with navigation links
 * depends_on: Card, Button, Link
 * related_docs: ../README.md
 */

interface Step {
  title: string
  description: string
  actionLabel: string
  href: string
}

const steps: Step[] = [
  {
    title: 'Create a Project',
    description:
      'Organize your work into projects to keep contexts and agents separate.',
    actionLabel: 'New Project',
    href: '/projects/new',
  },
  {
    title: 'Add Context',
    description: 'Upload or paste documents that your agents can reference.',
    actionLabel: 'Add Context',
    href: '/projects/new?step=context',
  },
  {
    title: 'Configure an Agent',
    description: 'Define agent behaviour and connect provider APIs.',
    actionLabel: 'New Agent',
    href: '/projects/new?step=agent',
  },
  {
    title: 'Start Chatting',
    description: 'Use your agent to begin synthesizing knowledge in chat.',
    actionLabel: 'Go to Dashboard',
    href: '/dashboard',
  },
]

export default function OnboardingSteps() {
  const [current, setCurrent] = useState(0)
  const step = steps[current]

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>
          Follow these steps to begin using the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {current >= steps.length - 1 && (
              <CheckIcon className="h-5 w-5 text-green-600" />
            )}
            {step.title}
          </h2>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
        >
          Previous
        </Button>
        <Button asChild>
          <Link href={step.href}>{step.actionLabel}</Link>
        </Button>
        <Button
          variant="outline"
          disabled={current === steps.length - 1}
          onClick={() => setCurrent((c) => Math.min(c + 1, steps.length - 1))}
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  )
}
