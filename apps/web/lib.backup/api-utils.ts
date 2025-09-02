import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  // console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}

export function requireAuth(session: any) {
  if (!session?.user?.id) {
    throw new ApiError('Unauthorized', 401);
  }
  return session.user;
}

export function generatePartyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
