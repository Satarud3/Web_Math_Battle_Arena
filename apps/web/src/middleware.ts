import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_key_math_battle_arena_2026');
    const { payload } = await jwtVerify(token, secret);
    const userRole = payload.role; // Mendapatkan 'PLAYER', 'ADMIN', atau 'MODERATOR'

    const url = request.nextUrl.clone();

    // Proteksi Halaman Admin: Jika mencoba akses /admin tapi bukan ADMIN
    if (url.pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Proteksi Halaman Dashboard: Jika ADMIN nyasar ke /dashboard, arahkan ke /admin
    if (url.pathname.startsWith('/dashboard') && userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('JWT verification failed in middleware:', error);
    // If the token is invalid, expired, or manipulated, redirect to login and clear the cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }
}

// Specify matching routes for protected zones only
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
