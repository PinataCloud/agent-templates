import type { APIRoute } from 'astro';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

export const GET: APIRoute = ({ params }) => {
  const file = params.file;
  if (!file || file.includes('..') || file.includes('/')) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = join(process.cwd(), 'public', file);
  if (!existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = '.' + file.split('.').pop()?.toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  return new Response(readFileSync(filePath), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
