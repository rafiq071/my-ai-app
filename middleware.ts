import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'; // Import NextResponse
import { getToken } from 'next-auth/jwt';
import { BETA_INVITE_COOKIE } from './lib/beta-access';
import { getInviteOnlyEnabled } from './lib/edge-flags';

const publicPaths = new Set<string>([
  '/',
  // Dodaj inne publiczne ścieżki
]);

// Middleware function
export function middleware(req: NextRequest) {
  const token = getToken({ req });

  // Dalsza logika
  return NextResponse.next(); // przykład odpowiedzi
}
