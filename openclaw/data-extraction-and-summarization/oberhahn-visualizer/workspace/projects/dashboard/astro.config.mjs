import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  // The platform's reverse proxy preserves the /app prefix, so `base` must match
  // the route path in manifest.json or every asset and link 404s.
  base: '/app',
  output: 'server',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  security: {
    // The proxy rewrites the request origin; Astro's origin check would reject
    // legitimate requests coming through it.
    checkOrigin: false,
  },
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});
