// next.config.js
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // turn PWA off in dev to avoid caching headaches
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(png|jpe?g|webp|svg|gif|tiff|js|css)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // IMPORTANT: Do NOT use static export when you have API routes/Prisma
  // output: 'export', // <-- remove this line

  images: {
    // you can keep this; 'unoptimized' is only required for static export
    domains: ['images.pexels.com'],
  },

  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  webpack: (config) => {
    // wasm support (for zxing etc.)
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // worker support (if you still use *.worker.ts)
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    });

    return config;
  },
};

module.exports = withPWA(nextConfig);
