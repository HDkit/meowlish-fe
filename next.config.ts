import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
				// Forward requests to the real backend server
				destination: 'http://khoakomlem-internal.ddns.net:1510/api/:path*',
			},
		];
	},
};

export default nextConfig;
