import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const rootDir = path.join(projectRoot, 'build');
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

const resolveRequestPath = (requestUrl) => {
  const url = new URL(requestUrl, `http://localhost:${port}`);
  const relativePath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(rootDir, normalizedPath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

   if (!existsSync(filePath) && path.extname(filePath).length === 0) {
    const htmlFilePath = `${filePath}.html`;
    if (existsSync(htmlFilePath) && statSync(htmlFilePath).isFile()) {
      filePath = htmlFilePath;
    }
  }

  return filePath;
};

const server = createServer((request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }

  const filePath = resolveRequestPath(request.url);
  const relativeFilePath = path.relative(rootDir, filePath);
  if (relativeFilePath.startsWith('..') || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] ?? 'application/octet-stream';

  response.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Local preview available at http://localhost:${port}`);
});
