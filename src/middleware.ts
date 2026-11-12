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
	'/blog',
	'/speaking-writing',
	'/speaking',
	'/writing',
	'/exam-approval',
	'/exam-creation',
	'/exam-management',
	'/blog-management',
];

// Define public routes
const publicRoutes = [
	'/',
	'/landing',
	'/auth',
];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the route is protected
	const isProtectedRoute = protectedRoutes.some(route =>
		pathname.startsWith(route)
	);

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
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
};
