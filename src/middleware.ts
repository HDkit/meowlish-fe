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

	// Check if user is authenticated (from Redux persist in localStorage)
	// This is a basic check - in production, use proper session/JWT validation
	const isAuthenticated = request.cookies.get('user_authenticated');

	// Redirect to auth if trying to access protected route without authentication
	if (isProtectedRoute && !isAuthenticated) {
		const url = request.nextUrl.clone();
		url.pathname = '/auth';
		return NextResponse.redirect(url);
	}

	// Redirect to dashboard if authenticated user tries to access auth page
	if (pathname === '/auth' && isAuthenticated) {
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
