/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable experimental features for better performance
    experimental: {
        optimizeCss: true,
    },
    
    // Image optimization for SEO
    images: {
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'adventure-time.ro',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: 'adventure-time.ro',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'https',
                hostname: 'loremflickr.com',
            },
            {
                protocol: 'https',
                hostname: 'fastly.picsum.photos',
            },
        ],
        domains: ['images.unsplash.com', 'i.pravatar.cc', 'placehold.co', 'adventure-time.ro', 'picsum.photos', 'fastly.picsum.photos'],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    
    // Compression for better Core Web Vitals
    compress: true,
    
    // Enable strict mode for better React optimization
    reactStrictMode: true,
    
    // PoweredByHeader removal for security
    poweredByHeader: false,
    
    // Enhanced security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                ],
            },
            // Cache static assets for better performance
            {
                source: '/(_next/static|favicon.ico|logo.png|robots.txt|sitemap.xml)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ]
    },
    
    // Redirects for SEO
    async redirects() {
        return [
            // Add any SEO redirects here if needed
            // Example: Old URLs to new ones
        ]
    },
    
    // Output optimization
    output: 'standalone',
    
    // ESLint configuration
    eslint: {
        dirs: ['app', 'components', 'lib'],
    },
    
    // TypeScript configuration
    typescript: {
        tsconfigPath: './tsconfig.json',
    },
}

export default nextConfig; 