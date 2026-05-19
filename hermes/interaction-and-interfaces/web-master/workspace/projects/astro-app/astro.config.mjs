import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';

export default defineConfig({
  base: '/app',
  output: 'server',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  integrations: [mdx()],
  security: {
    checkOrigin: false,
    allowedDomains: [
      { hostname: '**.devpinata.cloud', protocol: 'https' },
    ],
  },
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
  vite: {
    ssr: {
      external: ['better-sqlite3'],
    },
  },
});
