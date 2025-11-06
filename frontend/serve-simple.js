import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 3005;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  try {
    // Determinar la ruta del archivo
    let filePath = join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
    
    // Verificar si el archivo existe
    try {
      const stats = await stat(filePath);
      if (stats.isDirectory()) {
        filePath = join(filePath, 'index.html');
      }
    } catch (err) {
      // Si el archivo no existe, servir index.html (para SPA routing)
      filePath = join(__dirname, 'dist', 'index.html');
    }
    
    // Determinar el tipo MIME
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Leer y servir el archivo
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end(`Server Error: ${error.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
