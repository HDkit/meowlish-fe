import type { NextConfig } from 'next';

// Same base the API client uses (src/lib/api/auth-session.ts), minus any trailing /api.
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
				// Forward /api/* that has no local route handler to the backend gateway
				destination: `${API_ORIGIN}/api/:path*`,
			},
		];
	},
};

export default nextConfig;
