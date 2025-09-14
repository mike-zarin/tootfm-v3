"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Music } from "lucide-react"
interface Party {
  id: string
  code: string
  name: string
  hostId: string
  status: "WAITING" | "ACTIVE" | "PAUSED" | "ENDED"
  createdAt: string
  memberCount?: number
  trackCount?: number
  currentTrack?: {
    name: string
    artist: string
  }
}
export default function PartyListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (status === "authenticated") {
      fetchParties()
    }
  }, [status, router])
  const fetchParties = async () => {
    try {
      setError(null)
      const res = await fetch("/api/parties")
      if (!res.ok) {
        throw new Error(`Failed to fetch parties: ${res.statusText}`)
      }
      const data = await res.json()
      setParties(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('[ERROR]' + ' ' + "Failed to fetch parties:", error)
      setError(error instanceof Error ? error.message : "Failed to load parties")
    } finally {
      setLoading(false)
    }
  }
  const getStatusColor = (status: Party["status"]) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500"
      case "WAITING": return "bg-yellow-500"
      case "PAUSED": return "bg-orange-500"
      case "ENDED": return "bg-gray-500"
      default: return "bg-gray-400"
    }
  }
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading parties...</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchParties} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Parties</h1>
          <p className="text-muted-foreground mt-2">
            Create or join a party to start sharing music
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/party/join">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Join Party
            </Button>
          </Link>
          <Link href="/party/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Party
            </Button>
          </Link>
        </div>
      </div>
      {parties.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No parties yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first party or join an existing one to get started
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/party/create">
                <Button>Create Your First Party</Button>
              </Link>
              <Link href="/party/join">
                <Button variant="outline">Join with Code</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parties.map((party) => (
            <Link key={party.id} href={`/party/${party.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{party.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Code: <span className="font-mono font-semibold">{party.code}</span>
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(party.status)} text-white`}>
                      {party.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{party.memberCount || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Music className="h-4 w-4" />
                      <span>{party.trackCount || 0} tracks</span>
                    </div>
                  </div>
                  {party.currentTrack && party.status === "ACTIVE" && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">Now playing:</p>
                      <p className="text-sm font-medium line-clamp-1">
                        {party.currentTrack.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {party.currentTrack.artist}
                      </p>
                    </div>
                  )}
                  {party.hostId === session?.user?.id && (
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                      You&apos;re the host
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}