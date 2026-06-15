export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - blocked.html (prevent redirect loops)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|blocked.html).*)',
  ],
};

export default function middleware(request) {
  const country = request.headers.get('x-vercel-ip-country');
  const region = request.headers.get('x-vercel-ip-country-region');

  if (country !== 'US' || region === 'CA') {
    return Response.redirect(new URL('/blocked.html', request.url));
  }
}
