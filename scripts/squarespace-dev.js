const { spawn } = require("node:child_process");
const path = require("node:path");
const guards = require("./guards");
const { loadEnv } = require("./load-env");

/** @typedef {"--auth" | "--verbose"} CliFlag */

const SCRIPT_ARGS = process.argv.slice(2);
const rootDir = path.resolve(__dirname, "..");

const ENV_KEYS = {
  siteUrl: "SQUARESPACE_SITE_URL",
  devPort: "SQUARESPACE_DEV_PORT",
  devAuth: "SQUARESPACE_DEV_AUTH",
  devVerbose: "SQUARESPACE_DEV_VERBOSE",
};

const FLAGS = {
  auth: "--auth",
  verbose: "--verbose",
};

const CLI_VALUES = {
  enabled: "1",
  defaultPort: "9000",
};

const COMMANDS = {
  windowsShell: "cmd.exe",
  windowsExecutable: "squarespace-server.cmd",
  unixExecutable: "squarespace-server",
};

const WINDOWS_SHELL_ARGS = ["/d", "/s", "/c"];
const COMMAND_NOT_FOUND_PATTERN =
  /not recognized as an internal or external command|command not found/i;

const MESSAGES = {
  missingSiteUrl: "Missing SQUARESPACE_SITE_URL",
  siteUrlExample:
    'Example: $env:SQUARESPACE_SITE_URL="https://your-site.squarespace.com"; npm.cmd run sqsp:dev',
  startFailure: "Failed to start the Squarespace local development server.",
  installHint:
    "Install the Squarespace local development server first, then rerun this command.",
  docsUrl: "Docs: https://developers.squarespace.com/local-development",
};

loadEnv(rootDir);

/**
 * Converts argv list to a set for fast flag checks.
 *
 * @param {string[]} argv Raw script arguments.
 * @returns {Set<string>} Unique argument set.
 * @throws {Error} Never intentionally throws.
 */
function toArgSet(argv) {
  return new Set(argv);
}

/**
 * Checks whether a CLI/environment flag is enabled.
 *
 * @param {Set<string>} args Parsed args.
 * @param {CliFlag} flag CLI flag token.
 * @param {string | undefined} envValue Environment toggle value.
 * @returns {boolean} True when enabled by CLI or env.
 * @throws {Error} Never intentionally throws.
 */
function isFlagEnabled(args, flag, envValue) {
  return args.has(flag) || envValue === CLI_VALUES.enabled;
}

/**
 * Prints installation guidance for the Squarespace CLI.
 *
 * @returns {void}
 * @throws {Error} Never intentionally throws.
 */
function printInstallHint() {
  console.error(MESSAGES.installHint);
  console.error(MESSAGES.docsUrl);
}

/**
 * Ensures the required site URL is configured.
 *
 * @param {string | undefined} url Candidate site URL.
 * @returns {string} Validated site URL.
 * @throws {Error} Exits process when url is missing.
 */
function requireSiteUrl(url) {
  if (guards.isString(url) && url.length > 0) {
    return url;
  }

  console.error(MESSAGES.missingSiteUrl);
  console.error(MESSAGES.siteUrlExample);
  process.exit(1);
}

/**
 * Builds arguments for the Squarespace local development server.
 *
 * @param {string} url Site URL.
 * @param {string} port Port value.
 * @param {boolean} useAuth Whether auth flag is enabled.
 * @param {boolean} useVerbose Whether verbose flag is enabled.
 * @returns {string[]} CLI argument list.
 * @throws {Error} Never intentionally throws.
 */
function buildServerArgs(url, port, useAuth, useVerbose) {
  const serverArgs = [url, "--directory", rootDir, "--port", port];

  if (useAuth) {
    serverArgs.push(FLAGS.auth);
  }

  if (useVerbose) {
    serverArgs.push(FLAGS.verbose);
  }

  return serverArgs;
}

/**
 * Quotes command-line arguments for cmd.exe execution.
 *
 * @param {string} value Raw argument value.
 * @returns {string} Escaped argument text.
 * @throws {Error} Never intentionally throws.
 */
function quoteWindowsArg(value) {
  const escapedQuote = String.raw`\"`;
  return `"${String(value).replaceAll('"', escapedQuote)}"`;
}

/**
 * Spawns the Squarespace server process for the current platform.
 *
 * @param {string[]} serverArgs CLI arguments.
 * @returns {import("node:child_process").ChildProcess} Spawned child process.
 * @throws {Error} Thrown when process spawn fails.
 */
function spawnSquarespaceServer(serverArgs) {
  const spawnOptions = { cwd: rootDir, stdio: ["inherit", "pipe", "pipe"] };

  if (process.platform === "win32") {
    const shellCommand = [COMMANDS.windowsExecutable, ...serverArgs]
      .map(quoteWindowsArg)
      .join(" ");

    return spawn(
      COMMANDS.windowsShell,
      [...WINDOWS_SHELL_ARGS, shellCommand],
      spawnOptions,
    );
  }

  return spawn(COMMANDS.unixExecutable, serverArgs, spawnOptions);
}

/**
 * Pipes child output streams to parent streams while capturing text.
 *
 * @param {import("node:child_process").ChildProcess} child Spawned child process.
 * @returns {{ getOutput: () => string }} Accessor for accumulated output.
 * @throws {Error} Never intentionally throws.
 */
function bindChildOutput(child) {
  let output = "";

  const appendChunk = (chunk, writer) => {
    const text = String(chunk);
    output += text;
    writer.write(text);
  };

  if (child.stdout) {
    child.stdout.on("data", (chunk) => {
      appendChunk(chunk, process.stdout);
    });
  }

  if (child.stderr) {
    child.stderr.on("data", (chunk) => {
      appendChunk(chunk, process.stderr);
    });
  }

  return {
    getOutput() {
      return output;
    },
  };
}

/**
 * Handles process exit with command-not-found diagnostics.
 *
 * @param {number | null} code Child process exit code.
 * @param {string} output Combined stdout and stderr output.
 * @returns {void}
 * @throws {Error} Never intentionally throws.
 */
function handleProcessClose(code, output) {
  const missingCommand = COMMAND_NOT_FOUND_PATTERN.test(output);
  if (code !== 0 && missingCommand) {
    printInstallHint();
  }

  process.exit(code === null ? 1 : code);
}

/**
 * Starts the Squarespace local development server wrapper.
 *
 * @returns {void}
 * @throws {Error} Thrown when child process cannot be launched.
 */
function main() {
  const args = toArgSet(SCRIPT_ARGS);
  const siteUrl = requireSiteUrl(process.env[ENV_KEYS.siteUrl]);
  const port = process.env[ENV_KEYS.devPort] || CLI_VALUES.defaultPort;
  const useAuth = isFlagEnabled(
    args,
    FLAGS.auth,
    process.env[ENV_KEYS.devAuth],
  );
  const useVerbose = isFlagEnabled(
    args,
    FLAGS.verbose,
    process.env[ENV_KEYS.devVerbose],
  );
  const serverArgs = buildServerArgs(siteUrl, port, useAuth, useVerbose);

  let child;
  try {
    child = spawnSquarespaceServer(serverArgs);
  } catch (error) {
    console.error(MESSAGES.startFailure);
    console.error(error.message);
    printInstallHint();
    process.exit(1);
  }

  const outputLog = bindChildOutput(child);

  child.on("error", (error) => {
    console.error(MESSAGES.startFailure);
    console.error(error.message);
    printInstallHint();
    process.exit(1);
  });

  child.on("close", (code) => {
    handleProcessClose(code, outputLog.getOutput());
  });
}

main();
