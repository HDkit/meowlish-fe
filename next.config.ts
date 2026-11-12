import type { NextConfig } from 'next';

// The browser only ever talks to this app's own origin (src/lib/api/auth-session.ts): /api/* and
// /socket.io/* are proxied to the backend gateway here, so its SameSite session cookies are
// first-party. NEXT_PUBLIC_API_URL is the gateway origin (any trailing /api is dropped); it is
// read at build time, since rewrites are baked into the build.
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'https://meowlish.servebeer.com')
	.replace(/\/+$/, '')
	.replace(/\/api$/, '');

const nextConfig: NextConfig = {
	allowedDevOrigins: ['khoakomlem-internal.ddns.net'],
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true, // Temporary during migration
	},
	// Optimize dev server
	experimental: {
		optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
	},
	// Reduce initial load time
	modularizeImports: {
		'lucide-react': {
			transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
		},
	},
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				// Forward /api/* that has no local route handler to the backend gateway (including the
				// Google OAuth callback /api/v1/auth/google/callback: no page may live at that path).
				destination: `${API_ORIGIN}/api/:path*`,
			},
			{
				// socket.io (ChatPage): long-polling always works through this proxy; WebSocket
				// upgrades need `next start`/a reverse proxy that forwards them.
				source: '/socket.io/:path*',
				destination: `${API_ORIGIN}/api/v1/chat/ws/socket.io/:path*`,
			},
		];
	},
};

export default nextConfig;
