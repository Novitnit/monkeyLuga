import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith('/admin')) {
        console.log(token?.name, token?.role);
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.rewrite(new URL('/not-found', req.url));
      }
    }

    if (pathname.startsWith('/home')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    if((pathname.startsWith('/login') || pathname.startsWith('/register')) && token) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/home/:path*', '/login', '/register'],
};
