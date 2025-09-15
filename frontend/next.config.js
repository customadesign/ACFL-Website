/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    domains: ['storage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/msgsndr/**',
      },
    ],
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseWs = supabaseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const apiWs = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const connectSrc = isDevelopment
      ? `'self' https: ws: http://localhost:* ws://localhost:* ${supabaseUrl} ${supabaseWs} ${apiUrl} ${apiWs}`
      : `'self' https: wss: ${supabaseUrl} ${supabaseWs} ${apiUrl} ${apiWs}`;

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src ${connectSrc};`,
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Provide a safe default for production to avoid build-time error
    const backendURL = process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_API_URL
      : "http://localhost:3001";

    return [
      {
        source: "/api/:path*",
        destination: `${backendURL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
