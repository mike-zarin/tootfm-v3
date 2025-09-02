'use client'

import { Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Welcome to tootFM</CardTitle>
        <CardDescription>Sign in to start your party</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full"
          size="lg"
        >
          Continue with Google
        </Button>
        
        <Button 
          onClick={() => signIn('spotify', { callbackUrl })}
          className="w-full"
          variant="outline"
          size="lg"
        >
          Continue with Spotify
        </Button>
      </CardContent>
    </Card>
  )
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <Suspense fallback={<div>Loading...</div>}>
        <SignInContent />
      </Suspense>
    </div>
  )
}
