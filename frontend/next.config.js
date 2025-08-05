/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    unoptimized: process.env.NODE_ENV === "development",
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const connectSrc = isDevelopment
      ? "'self' https: http://localhost:*"
      : "'self' https:";

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
