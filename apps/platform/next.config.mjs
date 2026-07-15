import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@atlas/ui", "@atlas/api-client"],
  webpack: (config) => {
    config.resolve.alias['@tanstack/react-query'] = path.resolve(
      process.cwd(),
      'node_modules/@tanstack/react-query'
    );
    config.resolve.alias['react'] = path.resolve(
      process.cwd(),
      'node_modules/react'
    );
    config.resolve.alias['react-dom'] = path.resolve(
      process.cwd(),
      'node_modules/react-dom'
    );
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@tanstack/react-query': './node_modules/@tanstack/react-query',
      'react': './node_modules/react',
      'react-dom': './node_modules/react-dom',
    },
  },
};

export default nextConfig;
