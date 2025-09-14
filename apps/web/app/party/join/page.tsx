"use client"
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
