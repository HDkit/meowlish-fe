import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that require authentication
const protectedRoutes = [
	'/dashboard',
	'/test-selection',
	'/test',
	'/progress',
	'/history',
	'/user',
	'/user-management',
	'/flashcards',
	'/forum',
	'/speaking-writing',
	'/speaking',
	'/writing',
	'/exam-approval',
	'/exam-creation',
	'/exam-management',
	'/blog-management',
	'/report-management',
];

// Pages anyone can read, signed in or not. Writing (posting, commenting) still needs a session:
// the page sends anonymous visitors to the login page for that.
const publicSections = ['/blog'];

const inSection = (pathname: string, section: string) =>
	pathname === section || pathname.startsWith(`${section}/`);

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the route is protected
	// `/blog-management` starts with `/blog` but is not public: sections match whole segments.
	const isPublicSection = publicSections.some(section => inSection(pathname, section));
	const isProtectedRoute =
		!isPublicSection && protectedRoutes.some(route => pathname.startsWith(route));

	// Routing hint only: `user_authenticated` is a non-secret cookie set by the client once
	// GET /auth/my/identity succeeds and cleared on logout or a failed refresh. The real
	// session is the gateway's HttpOnly access/refresh cookies, which the API checks itself.
	const isAuthenticated = request.cookies.get('user_authenticated');

	// Redirect to auth if trying to access protected route without authentication
	if (isProtectedRoute && !isAuthenticated) {
		const url = request.nextUrl.clone();
		url.pathname = '/auth';
		return NextResponse.redirect(url);
	}

	// Redirect to dashboard if authenticated user tries to access auth or landing page
	if ((pathname === '/auth' || pathname === '/landing') && isAuthenticated) {
		const url = request.nextUrl.clone();
		url.pathname = '/dashboard';
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|socket.io|_next/static|_next/image|favicon.ico).*)',
	],
};
