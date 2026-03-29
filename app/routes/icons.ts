import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const ICONS_DIR = path.join(DATA_DIR, 'icons');

export async function loader({ params }: { params: Record<string, string> }) {
  const filename = params['*'];

  if (!filename || filename.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = path.join(ICONS_DIR, filename);

  // Security check: ensure file is within icons directory
  if (!filePath.startsWith(ICONS_DIR)) {
    return new Response('Not found', { status: 404 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const content = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();

  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  return new Response(content, {
    headers: {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000', // 1 year
    },
  });
}
