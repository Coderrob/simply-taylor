const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const path = require('path');
const less = require('less');
const { loadEnv } = require('./load-env');

const rootDir = path.resolve(__dirname, '..');
loadEnv(rootDir);

const stylesDir = path.join(rootDir, 'styles');
const previewSourceDir = path.join(rootDir, 'preview');
const previewBuildDir = path.join(rootDir, '.preview');
const port = Number(process.env.PREVIEW_PORT || process.env.PORT || 4321);
const runOnce = process.argv.includes('--once');

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function compileStyles() {
  const resetPath = path.join(stylesDir, 'reset.css');
  const basePath = path.join(stylesDir, 'base.less');
  const resetCss = await fsp.readFile(resetPath, 'utf8');
  const sourceLess = await fsp.readFile(basePath, 'utf8');
  const fontImports = Array.from(
    sourceLess.matchAll(/^\s*@import\s+url\((.+?)\);\s*$/gm),
    (match) => `@import url(${match[1]});`
  );
  const baseLess = sourceLess
    .replace(/^\s*@import\s+url\(.+?\);\s*$/gm, '')
    .replace(/^\s*@import\s+['"]sqs-grid-breaker['"];\s*$/gm, '');
  const compiled = await less.render(baseLess, {
    filename: basePath,
    paths: [stylesDir],
  });

  await ensureDir(previewBuildDir);
  await fsp.writeFile(
    path.join(previewBuildDir, 'site.css'),
    `${fontImports.join('\n')}\n${resetCss}\n\n${compiled.css}`,
    'utf8'
  );
}

async function buildPreview() {
  await compileStyles();
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'text/plain; charset=utf-8';
}

async function readServedFile(urlPath) {
  if (urlPath === '/site.css') {
    return path.join(previewBuildDir, 'site.css');
  }

  if (urlPath === '/site.js') {
    return path.join(rootDir, 'scripts', 'site.js');
  }

  const safePath = urlPath === '/' ? '/index.html' : urlPath;
  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  return path.join(previewSourceDir, normalized);
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const target = await readServedFile(req.url || '/');
      const stat = await fsp.stat(target);
      const filePath = stat.isDirectory() ? path.join(target, 'index.html') : target;
      const body = await fsp.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      res.end(body);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Preview file not found.');
    }
  });

  server.listen(port, () => {
    console.log(`Preview running at http://localhost:${port}`);
    console.log('Routes: /, /blog.html, /post.html');
  });
}

function watchStyles() {
  let rebuildTimer = null;
  const rebuild = async () => {
    try {
      await buildPreview();
      console.log('Rebuilt preview CSS');
    } catch (error) {
      console.error('Preview rebuild failed');
      console.error(error.message);
    }
  };

  fs.watch(stylesDir, { recursive: true }, (_eventType, filename) => {
    if (!filename || !/\.(less|css)$/i.test(filename)) return;
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuild, 60);
  });
}

async function main() {
  try {
    await buildPreview();
    console.log('Built preview CSS');

    if (runOnce) return;

    watchStyles();
    startServer();
  } catch (error) {
    console.error('Preview setup failed');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
