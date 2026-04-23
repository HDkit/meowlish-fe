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
				destination: 'https://meowlish.servebeer.com/api/:path*',
			},
		];
	},
};

export default nextConfig;
