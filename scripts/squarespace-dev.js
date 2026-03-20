const { spawn } = require('child_process');
const path = require('path');
const { loadEnv } = require('./load-env');

const rootDir = path.resolve(__dirname, '..');
loadEnv(rootDir);

const siteUrl = process.env.SQUARESPACE_SITE_URL;
const port = process.env.SQUARESPACE_DEV_PORT || '9000';
const args = process.argv.slice(2);
const useAuth = args.includes('--auth') || process.env.SQUARESPACE_DEV_AUTH === '1';
const useVerbose = args.includes('--verbose') || process.env.SQUARESPACE_DEV_VERBOSE === '1';

if (!siteUrl) {
  console.error('Missing SQUARESPACE_SITE_URL');
  console.error('Example: $env:SQUARESPACE_SITE_URL="https://your-site.squarespace.com"; npm.cmd run sqsp:dev');
  process.exit(1);
}

const serverArgs = [siteUrl, '--directory', rootDir, '--port', port];

if (useAuth) {
  serverArgs.push('--auth');
}

if (useVerbose) {
  serverArgs.push('--verbose');
}

function quoteWindowsArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

let child;

try {
  child = process.platform === 'win32'
    ? spawn(
        'cmd.exe',
        ['/d', '/s', '/c', ['squarespace-server.cmd'].concat(serverArgs).map(quoteWindowsArg).join(' ')],
        { cwd: rootDir, stdio: ['inherit', 'pipe', 'pipe'] }
      )
    : spawn('squarespace-server', serverArgs, {
        cwd: rootDir,
        stdio: ['inherit', 'pipe', 'pipe'],
      });
} catch (error) {
  console.error('Failed to start the Squarespace local development server.');
  console.error(error.message);
  console.error('Install the Squarespace local development server first, then rerun this command.');
  console.error('Docs: https://developers.squarespace.com/local-development');
  process.exit(1);
}

let output = '';

if (child.stdout) {
  child.stdout.on('data', (chunk) => {
    const text = String(chunk);
    output += text;
    process.stdout.write(text);
  });
}

if (child.stderr) {
  child.stderr.on('data', (chunk) => {
    const text = String(chunk);
    output += text;
    process.stderr.write(text);
  });
}

child.on('error', (error) => {
  console.error('Failed to start the Squarespace local development server.');
  console.error(error.message);
  console.error('Docs: https://developers.squarespace.com/local-development');
  process.exit(1);
});

child.on('close', (code) => {
  if (
    code !== 0 &&
    /not recognized as an internal or external command|command not found/i.test(output)
  ) {
    console.error('Install the Squarespace local development server first, then rerun this command.');
    console.error('Docs: https://developers.squarespace.com/local-development');
  }

  process.exit(code === null ? 1 : code);
});
