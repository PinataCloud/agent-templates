import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// __AGENT_HOST__ is replaced at import time with the actual agent hostname
const agentHost = '__AGENT_HOST__';

export default defineConfig({
  plugins: [react()],
  base: '/app',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [agentHost, 'pinclaw.devpinata.cloud', 'pinclaw.pinata.cloud'],
    hmr: {
      protocol: 'wss',
      host: agentHost,
      clientPort: 443,
    },
  },
});
