"use client"


import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
