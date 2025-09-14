"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';
export function JoinPartyForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 8) {
      setError('Party code must be 8 characters');
      return;
    }
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
              placeholder="Enter 8-character code"
              maxLength={8}
              pattern="[A-Z0-9]{8}"
              className="text-center font-mono text-2xl"
            />
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || code.length !== 8}>
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
