export const config = {
  matcher: '/',
};

export default function middleware(request) {
  const country = request.headers.get('x-vercel-ip-country');
  const region = request.headers.get('x-vercel-ip-country-region');

  if (country !== 'US' || region === 'CA') {
    return Response.redirect(new URL('/blocked.html', request.url));
  }
}
