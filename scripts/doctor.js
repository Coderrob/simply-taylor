const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const guards = require("./guards");
const { loadEnv } = require("./load-env");

const rootDir = path.resolve(__dirname, "..");
loadEnv(rootDir);

const siteUrl = process.env.SQUARESPACE_SITE_URL;

const STATUS = {
  pass: "OK",
  fail: "FAIL",
};

const LABELS = {
  sqspServer: "Squarespace local dev server callable",
};

const MESSAGES = {
  serverAvailable: "squarespace-server is available in the current shell.",
  serverMissing:
    "Install the Squarespace local development server and ensure squarespace-server is on PATH.",
  checksShape: "checks must be an array",
  resultShape: "result must include label and ok fields",
  checkArgsShape: "makeCheck requires (string, boolean, string)",
  relativePathType: "relativePath must be a string",
  setSiteUrl: "- Set SQUARESPACE_SITE_URL in your shell.",
  installServer: "- Install the official Squarespace local development server.",
  docs: "- Docs: https://developers.squarespace.com/local-development",
  usePreview: "- Use npm start for the local visual preview in the meantime.",
};

const CHECKS = {
  nodeDetected: { label: "Node.js detected" },
  packageJson: {
    label: "package.json present",
    path: "package.json",
    detail: "Required for npm script entrypoints.",
  },
  previewScript: {
    label: "Preview script present",
    path: "scripts/preview.js",
    detail: "Used by npm start and npm run build.",
  },
  devWrapper: {
    label: "Squarespace dev wrapper present",
    path: "scripts/squarespace-dev.js",
    detail: "Used by npm run dev.",
  },
  envExample: {
    label: ".env example present",
    path: ".env.example",
    detail: "Copy this file to .env or .env.local to configure local settings.",
  },
  siteUrl: {
    label: "SQUARESPACE_SITE_URL configured",
    detailMissing:
      'Set it in PowerShell, for example: $env:SQUARESPACE_SITE_URL="https://your-site.squarespace.com"',
  },
};

const NEXT_STEPS = {
  header: "Next steps:",
  preview: "- npm start",
  dev: "- npm run dev",
};

/**
 * Prints a single health check result row.
 *
 * @param {{ label: string, ok: boolean, detail: string }} result Check result.
 * @returns {boolean} The result success flag.
 * @throws {TypeError} Thrown when result is malformed.
 */
function printCheck(result) {
  if (
    !guards.isObject(result) ||
    !guards.isString(result.label) ||
    !guards.isBoolean(result.ok)
  ) {
    throw new TypeError(MESSAGES.resultShape);
  }

  const status = result.ok ? STATUS.pass : STATUS.fail;
  console.log(`[${status}] ${result.label}`);
  if (result.detail) {
    console.log(`       ${result.detail}`);
  }

  return result.ok;
}

/**
 * Creates a standard check result object.
 *
 * @param {string} label Check label.
 * @param {boolean} ok Success flag.
 * @param {string} detail Additional detail text.
 * @returns {{ label: string, ok: boolean, detail: string }} Check result.
 * @throws {TypeError} Thrown when inputs are invalid.
 */
function makeCheck(label, ok, detail) {
  if (
    !guards.isString(label) ||
    !guards.isBoolean(ok) ||
    !guards.isString(detail)
  ) {
    throw new TypeError(MESSAGES.checkArgsShape);
  }

  return { label, ok, detail };
}

/**
 * Tests whether a path exists from the repository root.
 *
 * @param {string} relativePath Path relative to repository root.
 * @returns {boolean} True when the path exists.
 * @throws {TypeError} Thrown when relativePath is not a string.
 */
function rootPathExists(relativePath) {
  if (!guards.isString(relativePath)) {
    throw new TypeError(MESSAGES.relativePathType);
  }

  return fs.existsSync(path.join(rootDir, relativePath));
}

/**
 * Returns the executable name for the Squarespace CLI on this platform.
 *
 * @returns {string} Command name for probing.
 * @throws {Error} Propagates platform access errors.
 */
function getSquarespaceCommand() {
  return process.platform === "win32"
    ? "squarespace-server.cmd"
    : "squarespace-server";
}

/**
 * Checks whether the Squarespace local development server can be called.
 *
 * @returns {{ label: string, ok: boolean, detail: string }} Check result object.
 * @throws {Error} Propagates unexpected child process errors.
 */
function checkSquarespaceServer() {
  const probe = spawnSync(getSquarespaceCommand(), ["--help"], {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (!probe.error && probe.status === 0) {
    return makeCheck(LABELS.sqspServer, true, MESSAGES.serverAvailable);
  }

  return makeCheck(LABELS.sqspServer, false, MESSAGES.serverMissing);
}

/**
 * Builds all doctor checks for the current environment.
 *
 * @returns {Array<{ label: string, ok: boolean, detail: string }>} Ordered list of checks.
 * @throws {Error} Propagates file-system and child-process errors.
 */
function buildChecks() {
  return [
    makeCheck(
      CHECKS.nodeDetected.label,
      Boolean(process.version),
      `Using ${process.version}`,
    ),
    makeCheck(
      CHECKS.packageJson.label,
      rootPathExists(CHECKS.packageJson.path),
      CHECKS.packageJson.detail,
    ),
    makeCheck(
      CHECKS.previewScript.label,
      rootPathExists(CHECKS.previewScript.path),
      CHECKS.previewScript.detail,
    ),
    makeCheck(
      CHECKS.devWrapper.label,
      rootPathExists(CHECKS.devWrapper.path),
      CHECKS.devWrapper.detail,
    ),
    makeCheck(
      CHECKS.envExample.label,
      rootPathExists(CHECKS.envExample.path),
      CHECKS.envExample.detail,
    ),
    makeCheck(
      CHECKS.siteUrl.label,
      Boolean(siteUrl),
      siteUrl ? `Current value: ${siteUrl}` : CHECKS.siteUrl.detailMissing,
    ),
    checkSquarespaceServer(),
  ];
}

/**
 * Renders the final doctor summary and recommendations.
 *
 * @param {Array<{ label: string, ok: boolean, detail: string }>} checks Executed checks.
 * @returns {void}
 * @throws {TypeError} Thrown when checks is not an array.
 */
function printSummary(checks) {
  if (!Array.isArray(checks)) {
    throw new TypeError(MESSAGES.checksShape);
  }

  const allPassed = checks.every((check) => check.ok);
  const serverCheck = checks.find((check) => check.label === LABELS.sqspServer);

  console.log("");
  if (allPassed) {
    console.log("Environment looks ready.");
    console.log(NEXT_STEPS.header);
    console.log(NEXT_STEPS.preview);
    console.log(NEXT_STEPS.dev);
    return;
  }

  console.log("Environment is not fully ready.");
  console.log(NEXT_STEPS.header);
  if (!siteUrl) {
    console.log(MESSAGES.setSiteUrl);
  }
  if (serverCheck && !serverCheck.ok) {
    console.log(MESSAGES.installServer);
    console.log(MESSAGES.docs);
  }
  console.log(MESSAGES.usePreview);
  process.exitCode = 1;
}

/**
 * Runs environment diagnostics for local development readiness.
 *
 * @returns {void}
 * @throws {Error} Propagates unexpected runtime failures.
 */
function main() {
  const checks = buildChecks();
  for (const check of checks) {
    printCheck(check);
  }

  printSummary(checks);
}

main();
