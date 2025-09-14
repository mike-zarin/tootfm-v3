"use client"
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
