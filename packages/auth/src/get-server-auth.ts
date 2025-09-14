import { getServerSession } from "next-auth";
import { authConfig } from "./auth-config";
import { redirect } from "next/navigation";

export async function getServerAuth() {
  const session = await getServerSession(authConfig);
  return session;
}

export async function requireAuth() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  return session;
}

export async function requireHost(partyId: string) {
  const session = await requireAuth();
  const { prisma } = await import("@tootfm/database");
  
  const party = await prisma.party.findUnique({
    where: { id: partyId },
    select: { hostId: true }
  });
  
  if (!party || party.hostId !== (session.user as any).id) {
    redirect("/");
  }
  
  return session;
}
