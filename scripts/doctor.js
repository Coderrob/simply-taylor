const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadEnv } = require('./load-env');

const rootDir = path.resolve(__dirname, '..');
loadEnv(rootDir);

const siteUrl = process.env.SQUARESPACE_SITE_URL;

function check(label, ok, detail) {
  const status = ok ? 'OK' : 'FAIL';
  console.log(`[${status}] ${label}`);
  if (detail) {
    console.log(`       ${detail}`);
  }
  return ok;
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function checkSquarespaceServer() {
  const command = process.platform === 'win32' ? 'squarespace-server.cmd' : 'squarespace-server';
  const probe = spawnSync(command, ['--help'], {
    cwd: rootDir,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (!probe.error && probe.status === 0) {
    return {
      ok: true,
      detail: 'squarespace-server is available in the current shell.',
    };
  }

  return {
    ok: false,
    detail: 'Install the Squarespace local development server and ensure `squarespace-server` is on PATH.',
  };
}

function main() {
  let ok = true;

  ok = check('Node.js detected', Boolean(process.version), `Using ${process.version}`) && ok;
  ok = check('package.json present', exists('package.json'), 'Required for npm script entrypoints.') && ok;
  ok = check('Preview script present', exists('scripts/preview.js'), 'Used by `npm start` and `npm run build`.') && ok;
  ok = check('Squarespace dev wrapper present', exists('scripts/squarespace-dev.js'), 'Used by `npm run dev`.') && ok;
  ok = check(
    '.env example present',
    exists('.env.example'),
    'Copy this file to `.env` or `.env.local` to configure local settings.'
  ) && ok;
  ok = check(
    'SQUARESPACE_SITE_URL configured',
    Boolean(siteUrl),
    siteUrl
      ? `Current value: ${siteUrl}`
      : 'Set it in PowerShell, for example: $env:SQUARESPACE_SITE_URL="https://your-site.squarespace.com"'
  ) && ok;

  const sqspServer = checkSquarespaceServer();
  ok = check('Squarespace local dev server callable', sqspServer.ok, sqspServer.detail) && ok;

  console.log('');
  if (ok) {
    console.log('Environment looks ready.');
    console.log('Next steps:');
    console.log('- npm start');
    console.log('- npm run dev');
    return;
  }

  console.log('Environment is not fully ready.');
  console.log('Next steps:');
  if (!siteUrl) {
    console.log('- Set SQUARESPACE_SITE_URL in your shell.');
  }
  if (!sqspServer.ok) {
    console.log('- Install the official Squarespace local development server.');
    console.log('- Docs: https://developers.squarespace.com/local-development');
  }
  console.log('- Use `npm start` for the local visual preview in the meantime.');
  process.exitCode = 1;
}

main();
