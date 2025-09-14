'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Error</CardTitle>
        <CardDescription>
          {error === 'OAuthAccountNotLinked' 
            ? 'This email is already associated with another account.'
            : 'An error occurred during authentication.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Error code: {error || 'Unknown'}
        </p>
        <Link href="/auth/signin">
          <Button className="w-full">Try Again</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  )
}
