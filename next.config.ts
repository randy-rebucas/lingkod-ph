
import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // Suppress webpack warnings for Handlebars require.extensions
    config.ignoreWarnings = [
      {
        module: /node_modules\/handlebars/,
        message: /require\.extensions is not supported by webpack/,
      },
    ];

    // Add fallbacks for Node.js modules that might be used by Genkit and other packages
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        http2: false,
        os: false,
        buffer: false,
        process: false,
        path: false,
        querystring: false,
        zlib: false,
        events: false,
        child_process: false,
        cluster: false,
        dgram: false,
        dns: false,
        domain: false,
        module: false,
        readline: false,
        repl: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tty: false,
        vm: false,
        punycode: false,
      };

      // Handle node: protocol imports
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:events': false,
        'node:process': false,
        'node:stream': false,
        'node:util': false,
        'node:http': false,
        'node:https': false,
        'node:http2': false,
        'node:fs': false,
        'node:path': false,
        'node:crypto': false,
        'node:os': false,
        'node:buffer': false,
        'node:querystring': false,
        'node:zlib': false,
        'node:url': false,
        'node:assert': false,
        'node:net': false,
        'node:tls': false,
      };
    }

    return config;
  },
};

export default withNextIntl(nextConfig);
