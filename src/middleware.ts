import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-for-local-dev-only"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  if (!token) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  } catch (err) {
    if (!isLoginPage) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
