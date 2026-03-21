const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const less = require("less");
const { loadEnv } = require("./load-env");

const rootDir = path.resolve(__dirname, "..");
loadEnv(rootDir);

const stylesDir = path.join(rootDir, "styles");
const previewSourceDir = path.join(rootDir, "preview");
const previewBuildDir = path.join(rootDir, ".preview");
const port = Number(process.env.PREVIEW_PORT || process.env.PORT || 4321);
const runOnce = process.argv.includes("--once");
const STYLE_FILE_PATTERN = /\.(less|css)$/i;
const FONT_IMPORT_PATTERN = /^\s*@import\s+url\((.+?)\);\s*$/gm;
const RESET_IMPORT_PATTERN = /^\s*@import\s+url\(.+?\);\s*$/gm;
const GRID_BREAKER_IMPORT_PATTERN =
  /^\s*@import\s+['"]sqs-grid-breaker['"];\s*$/gm;

const FILE_NAMES = {
  resetCss: "reset.css",
  baseLess: "base.less",
  siteCss: "site.css",
  siteJs: "site.js",
  guardsJs: "guards.js",
  indexHtml: "index.html",
};

const ENCODING = {
  utf8: "utf8",
};

const LOG_MESSAGES = {
  previewReady: (previewPort) =>
    `Preview running at http://localhost:${previewPort}`,
  routes: "Routes: /, /blog.html, /post.html",
  rebuilt: "Rebuilt preview CSS",
  rebuildFailed: "Preview rebuild failed",
  built: "Built preview CSS",
  setupFailed: "Preview setup failed",
  notFound: "Preview file not found.",
};

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const STATIC_ROUTE_TO_FILE = {
  "/site.css": path.join(previewBuildDir, FILE_NAMES.siteCss),
  "/site.js": path.join(rootDir, "scripts", FILE_NAMES.siteJs),
  "/guards.js": path.join(rootDir, "scripts", FILE_NAMES.guardsJs),
};

/**
 * Ensures that a directory exists.
 *
 * @param {string} dir Absolute directory path.
 * @returns {Promise<void>} Resolves when directory exists.
 * @throws {Error} Thrown when directory creation fails.
 */
async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

/**
 * Extracts literal @import url(...) lines from LESS source.
 *
 * @param {string} sourceLess Raw LESS content.
 * @returns {string[]} Normalized import lines.
 * @throws {Error} Thrown when regex execution fails.
 */
function collectFontImports(sourceLess) {
  return Array.from(
    sourceLess.matchAll(FONT_IMPORT_PATTERN),
    (match) => `@import url(${match[1]});`,
  );
}

/**
 * Removes imports that should not be passed to the LESS compiler.
 *
 * @param {string} sourceLess Raw LESS content.
 * @returns {string} LESS source with unsupported imports removed.
 * @throws {Error} Thrown when replacement fails.
 */
function stripNonCompilableImports(sourceLess) {
  return sourceLess
    .replaceAll(RESET_IMPORT_PATTERN, "")
    .replaceAll(GRID_BREAKER_IMPORT_PATTERN, "");
}

/**
 * Compiles template styles into the preview CSS bundle.
 *
 * @returns {Promise<void>} Resolves when preview CSS is written.
 * @throws {Error} Thrown when reading, compiling, or writing fails.
 */
async function compileStyles() {
  const resetPath = path.join(stylesDir, FILE_NAMES.resetCss);
  const basePath = path.join(stylesDir, FILE_NAMES.baseLess);
  const resetCss = await fsp.readFile(resetPath, ENCODING.utf8);
  const sourceLess = await fsp.readFile(basePath, ENCODING.utf8);
  const fontImports = collectFontImports(sourceLess);
  const baseLess = stripNonCompilableImports(sourceLess);
  const compiled = await less.render(baseLess, {
    filename: basePath,
    paths: [stylesDir],
  });

  await ensureDir(previewBuildDir);
  await fsp.writeFile(
    path.join(previewBuildDir, FILE_NAMES.siteCss),
    `${fontImports.join("\n")}\n${resetCss}\n\n${compiled.css}`,
    ENCODING.utf8,
  );
}

/**
 * Executes the preview build step.
 *
 * @returns {Promise<void>} Resolves when build is complete.
 * @throws {Error} Thrown when style compilation fails.
 */
async function buildPreview() {
  await compileStyles();
}

/**
 * Resolves response content type for a file path.
 *
 * @param {string} filePath Absolute file path.
 * @returns {string} HTTP content type header value.
 * @throws {Error} Never intentionally throws.
 */
function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "text/plain; charset=utf-8";
}

/**
 * Sanitizes a preview URL path into a safe relative file path.
 *
 * @param {string} urlPath Request pathname.
 * @returns {string} Normalized relative path under preview source dir.
 * @throws {Error} Thrown when path normalization fails.
 */
function normalizePreviewPath(urlPath) {
  const safePath = urlPath === "/" ? `/${FILE_NAMES.indexHtml}` : urlPath;
  return path.normalize(safePath).replace(/^(\.\.[/\\])+/, "");
}

/**
 * Maps a request URL path to the on-disk file path to serve.
 *
 * @param {string} urlPath Request pathname.
 * @returns {string} Absolute file path for the response body.
 * @throws {Error} Thrown when route resolution fails.
 */
function resolveServedPath(urlPath) {
  const staticFile = STATIC_ROUTE_TO_FILE[urlPath];
  if (staticFile) {
    return staticFile;
  }

  return path.join(previewSourceDir, normalizePreviewPath(urlPath));
}

/**
 * Resolves a URL path to the final readable file path.
 *
 * @param {string} urlPath Request pathname.
 * @returns {Promise<string>} Absolute path to a file (not a directory).
 * @throws {Error} Thrown when target path does not exist.
 */
async function resolveFilePath(urlPath) {
  const targetPath = resolveServedPath(urlPath);
  const stat = await fsp.stat(targetPath);
  if (stat.isDirectory()) {
    return path.join(targetPath, FILE_NAMES.indexHtml);
  }

  return targetPath;
}

/**
 * Handles one HTTP request for preview assets.
 *
 * @param {import("node:http").IncomingMessage} req HTTP request.
 * @param {import("node:http").ServerResponse} res HTTP response.
 * @returns {Promise<void>} Resolves after response is sent.
 * @throws {Error} Thrown when writing response fails.
 */
async function handleRequest(req, res) {
  const urlPath = new URL(req.url || "/", `http://localhost:${port}`).pathname;

  try {
    const filePath = await resolveFilePath(urlPath);
    const body = await fsp.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(LOG_MESSAGES.notFound);
  }
}

/**
 * Starts the local preview HTTP server.
 *
 * @returns {void}
 * @throws {Error} Thrown when server startup fails.
 */
function startServer() {
  const server = http.createServer((req, res) => {
    void handleRequest(req, res);
  });

  server.listen(port, () => {
    console.log(LOG_MESSAGES.previewReady(port));
    console.log(LOG_MESSAGES.routes);
  });
}

/**
 * Checks whether a file name is a watched style file.
 *
 * @param {string} fileName File name to evaluate.
 * @returns {boolean} True for LESS/CSS files.
 * @throws {Error} Never intentionally throws.
 */
function isStyleFileName(fileName) {
  return STYLE_FILE_PATTERN.test(fileName);
}

/**
 * Registers a file-system watch for one style entry path.
 *
 * @param {string} fullPath Absolute entry path.
 * @param {(eventType: string, filename: string | Buffer | null) => void} onChange Change callback.
 * @returns {void}
 * @throws {Error} Thrown when stat or watch fails.
 */
function watchStyleEntry(fullPath, onChange) {
  const stat = fs.statSync(fullPath);
  const isWatchTarget =
    stat.isDirectory() || isStyleFileName(path.basename(fullPath));
  if (isWatchTarget) {
    fs.watch(fullPath, onChange);
  }
}

/**
 * Starts style watchers and triggers rebuilds on changes.
 *
 * @returns {void}
 * @throws {Error} Thrown when watcher registration fails.
 */
function watchStyles() {
  let rebuildTimer = null;
  const rebuild = async () => {
    try {
      await buildPreview();
      console.log(LOG_MESSAGES.rebuilt);
    } catch (error) {
      console.error(LOG_MESSAGES.rebuildFailed);
      console.error(error.message);
    }
  };

  const scheduleRebuild = (_eventType, filename) => {
    if (!filename || !isStyleFileName(String(filename))) {
      return;
    }

    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuild, 60);
  };

  const entries = fs.readdirSync(stylesDir);
  for (const entry of entries) {
    watchStyleEntry(path.join(stylesDir, entry), scheduleRebuild);
  }

  fs.watch(stylesDir, scheduleRebuild);
}

/**
 * Orchestrates preview build, watch, and server startup.
 *
 * @returns {Promise<void>} Resolves when one-off build completes or server starts.
 * @throws {Error} Thrown when setup fails.
 */
async function runPreview() {
  await buildPreview();
  console.log(LOG_MESSAGES.built);

  if (runOnce) {
    return;
  }

  watchStyles();
  startServer();
}

/**
 * Starts preview execution with top-level error handling.
 *
 * @returns {Promise<void>} Resolves when startup work is complete.
 * @throws {Error} Never intentionally throws.
 */
async function bootstrap() {
  try {
    await runPreview();
  } catch (error) {
    console.error(LOG_MESSAGES.setupFailed);
    console.error(error);
    process.exitCode = 1;
  }
}

// biome-ignore lint/style/useTopLevelAwait: CommonJS scripts cannot use top-level await.
void bootstrap();
