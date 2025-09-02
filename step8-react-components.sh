#!/bin/bash

# step8-react-components.sh - React Components
# CTO: Основные компоненты интерфейса

set -e

echo "⚛️ Step 8: Creating React Components"
echo "====================================="

# Create component directories
mkdir -p apps/web/components/{party,auth,layout}

# 1. Home page component
echo "🏠 Creating home page..."
cat > apps/web/app/page.tsx << 'EOF'
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authConfig } from '@tootfm/auth';
import { Button } from '@tootfm/ui';
import { Music, Users, Zap } from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession(authConfig);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-black">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">tootFM</h1>
          </div>
          
          <nav>
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-400">Hi, {session.user.name}</span>
                <Link href="/api/auth/signout">
                  <Button variant="ghost" size="sm">Sign Out</Button>
                </Link>
              </div>
            ) : (
              <Link href="/api/auth/signin">
                <Button>Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Democratic DJ for Your Party
          </h2>
          <p className="text-xl text-gray-400">
            AI-powered music mixing that reads the room
          </p>
        </div>
        
        {session ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/party/create">
              <div className="bg-gray-900/50 p-8 rounded-xl border border-gray-800 hover:border-purple-500 transition cursor-pointer">
                <Users className="w-12 h-12 text-purple-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Create Party</h3>
                <p className="text-gray-400">Start a new music session</p>
              </div>
            </Link>
            
            <Link href="/party/join">
              <div className="bg-gray-900/50 p-8 rounded-xl border border-gray-800 hover:border-purple-500 transition cursor-pointer">
                <Zap className="w-12 h-12 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Join Party</h3>
                <p className="text-gray-400">Enter a party code</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <Link href="/api/auth/signin">
              <Button size="lg" className="gradient-purple">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
EOF

# 2. Party Card Component
echo "🎉 Creating PartyCard component..."
cat > apps/web/components/party/PartyCard.tsx << 'EOF'
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@tootfm/ui';
import { Music, Users, Clock } from 'lucide-react';

interface PartyCardProps {
  party: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    status: string;
    _count: {
      members: number;
      tracks: number;
    };
  };
  isHost?: boolean;
}

export function PartyCard({ party, isHost = false }: PartyCardProps) {
  const statusColor = {
    WAITING: 'secondary',
    ACTIVE: 'default',
    PAUSED: 'outline',
    ENDED: 'destructive'
  }[party.status] || 'secondary';
  
  return (
    <Link href={`/party/${party.id}`}>
      <Card className="hover:border-purple-500 transition-all cursor-pointer">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{party.name}</CardTitle>
            <Badge variant={statusColor as any}>{party.status}</Badge>
          </div>
          {party.description && (
            <p className="text-sm text-gray-400 mt-2">{party.description}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-gray-400">
                <Users className="w-4 h-4" />
                {party._count.members}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Music className="w-4 h-4" />
                {party._count.tracks}
              </span>
            </div>
            
            <div className="font-mono text-purple-400">
              {party.code}
            </div>
          </div>
          
          {isHost && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <span className="text-xs text-purple-400">You are the host</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
EOF

# 3. Create Party Form
echo "📝 Creating CreatePartyForm..."
cat > apps/web/components/party/CreatePartyForm.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@tootfm/ui';
import { Loader2 } from 'lucide-react';

export function CreatePartyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to create party');
      
      const party = await res.json();
      router.push(`/party/${party.id}`);
    } catch (error) {
      console.error('Error creating party:', error);
      setLoading(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Party</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Party Name
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Friday Night Vibes"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Let's party!"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Party'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
EOF

# 4. Join Party Form
echo "🤝 Creating JoinPartyForm..."
cat > apps/web/components/party/JoinPartyForm.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@tootfm/ui';
import { Loader2 } from 'lucide-react';

export function JoinPartyForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/parties/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join party');
      }
      
      router.push(`/party/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join a Party</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Party Code
            </label>
            <Input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="text-center font-mono text-2xl"
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Party'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
EOF

# 5. Create party pages
echo "📄 Creating party pages..."
mkdir -p apps/web/app/party/{create,join,\[id\]}

cat > apps/web/app/party/create/page.tsx << 'EOF'
import { CreatePartyForm } from '@/components/party/CreatePartyForm';

export default function CreatePartyPage() {
  return (
    <div className="min-h-screen bg-black py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Create a Party
        </h1>
        <CreatePartyForm />
      </div>
    </div>
  );
}
EOF

cat > apps/web/app/party/join/page.tsx << 'EOF'
import { JoinPartyForm } from '@/components/party/JoinPartyForm';

export default function JoinPartyPage() {
  return (
    <div className="min-h-screen bg-black py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Join a Party
        </h1>
        <JoinPartyForm />
      </div>
    </div>
  );
}
EOF

cat > apps/web/app/party/\[id\]/page.tsx << 'EOF'
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@tootfm/auth';
import { prisma } from '@tootfm/database';

interface PartyPageProps {
  params: { id: string };
}

export default async function PartyPage({ params }: PartyPageProps) {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    return <div>Please sign in</div>;
  }
  
  const party = await prisma.party.findUnique({
    where: { id: params.id },
    include: {
      host: true,
      members: { include: { user: true } },
      tracks: { take: 20 }
    }
  });
  
  if (!party) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{party.name}</h1>
        <p className="text-gray-400 mb-8">Code: {party.code}</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Tracks</h2>
            {party.tracks.length === 0 ? (
              <p className="text-gray-500">No tracks yet</p>
            ) : (
              <div className="space-y-2">
                {party.tracks.map((track) => (
                  <div key={track.id} className="bg-gray-900 p-3 rounded">
                    <p className="font-medium">{track.title}</p>
                    <p className="text-sm text-gray-400">{track.artist}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Members</h2>
            <div className="space-y-2">
              {party.members.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full" />
                  <span>{member.user.name || 'Anonymous'}</span>
                  {member.role === 'host' && (
                    <span className="text-xs bg-purple-600 px-2 py-1 rounded">Host</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

echo ""
echo "✅ Step 8 Complete: React Components created!"
echo ""
echo "📋 Created:"
echo "  - Updated home page"
echo "  - PartyCard component"
echo "  - CreatePartyForm component"
echo "  - JoinPartyForm component"
echo "  - Party pages (create, join, [id])"
echo ""
echo "🎉 INSTALLATION COMPLETE!"
echo ""
echo "Next steps to run the app:"
echo "  1. npm install"
echo "  2. npx prisma generate"
echo "  3. npx prisma db push"
echo "  4. npm run dev"
