const fs = require("node:fs");
const path = require("node:path");
const guards = require("./guards");

const guardHelpers = {
  isString(value) {
    if (typeof guards.isString === "function") {
      return guards.isString(value);
    }

    return typeof value === "string";
  },
  isObject(value) {
    if (typeof guards.isObject === "function") {
      return guards.isObject(value);
    }

    return value !== null && typeof value === "object" && !Array.isArray(value);
  },
};

const TOKENS = {
  commentPrefix: "#",
  separator: "=",
  doubleQuote: '"',
  singleQuote: "'",
};

const FILE_NAMES = [".env", ".env.local"];
const ENCODING = {
  utf8: "utf8",
};

const ERRORS = {
  lineType: "line must be a string",
  valueType: "value must be a string",
  rawLineType: "rawLine must be a string",
  entryShape: "entry must include string key and value",
  contentType: "content must be a string",
  rootDirType: "rootDir must be a string",
};

/**
 * Determines whether a line should be ignored by the env parser.
 *
 * @param {string} line Trimmed line from an env file.
 * @returns {boolean} True when the line is empty or a comment.
 * @throws {TypeError} Thrown when line is not a string.
 */
function isIgnorableLine(line) {
  if (!guardHelpers.isString(line)) {
    throw new TypeError(ERRORS.lineType);
  }

  return line.length === 0 || line.startsWith(TOKENS.commentPrefix);
}

/**
 * Removes matching surrounding quotes from a value.
 *
 * @param {string} value Raw env value.
 * @returns {string} Unquoted value when wrapping quotes exist.
 * @throws {TypeError} Thrown when value is not a string.
 */
function stripWrappingQuotes(value) {
  if (!guardHelpers.isString(value)) {
    throw new TypeError(ERRORS.valueType);
  }

  const hasDoubleQuotes =
    value.startsWith(TOKENS.doubleQuote) && value.endsWith(TOKENS.doubleQuote);
  const hasSingleQuotes =
    value.startsWith(TOKENS.singleQuote) && value.endsWith(TOKENS.singleQuote);

  if (hasDoubleQuotes || hasSingleQuotes) {
    return value.slice(1, -1);
  }

  return value;
}

/**
 * Parses a single env line into a key/value pair.
 *
 * @param {string} rawLine One line from an env file.
 * @returns {{ key: string, value: string } | null} Parsed entry or null when invalid.
 * @throws {TypeError} Thrown when rawLine is not a string.
 */
function parseEnvLine(rawLine) {
  if (!guardHelpers.isString(rawLine)) {
    throw new TypeError(ERRORS.rawLineType);
  }

  const line = rawLine.trim();
  if (isIgnorableLine(line)) {
    return null;
  }

  const separatorIndex = line.indexOf(TOKENS.separator);
  if (separatorIndex < 0) {
    return null;
  }

  const key = line.slice(0, separatorIndex).trim();
  const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());

  return { key, value };
}

/**
 * Applies one env entry without overwriting an existing process env value.
 *
 * @param {{ key: string, value: string }} entry Parsed env entry.
 * @returns {void}
 * @throws {TypeError} Thrown when entry is missing required fields.
 */
function applyEnvEntry(entry) {
  if (
    !guardHelpers.isObject(entry) ||
    !guardHelpers.isString(entry.key) ||
    !guardHelpers.isString(entry.value)
  ) {
    throw new TypeError(ERRORS.entryShape);
  }

  if (!(entry.key in process.env)) {
    process.env[entry.key] = entry.value;
  }
}

/**
 * Parses and applies environment variables from file content.
 *
 * @param {string} content Env file content.
 * @returns {void}
 * @throws {TypeError} Thrown when content is not a string.
 */
function parseEnv(content) {
  if (!guardHelpers.isString(content)) {
    throw new TypeError(ERRORS.contentType);
  }

  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const entry = parseEnvLine(rawLine);
    if (entry) {
      applyEnvEntry(entry);
    }
  }
}

/**
 * Returns supported env file paths in load order.
 *
 * @param {string} rootDir Repository root directory.
 * @returns {string[]} Absolute candidate paths.
 * @throws {TypeError} Thrown when rootDir is not a string.
 */
function getEnvCandidates(rootDir) {
  if (!guardHelpers.isString(rootDir)) {
    throw new TypeError(ERRORS.rootDirType);
  }

  return FILE_NAMES.map((relativePath) => path.join(rootDir, relativePath));
}

/**
 * Loads environment variables from .env files if present.
 * Existing process environment variables are never overwritten.
 *
 * @param {string} rootDir Repository root directory.
 * @returns {void}
 * @throws {TypeError} Thrown when rootDir is invalid.
 * @throws {Error} Thrown when an existing env file cannot be read.
 */
function loadEnv(rootDir) {
  const candidates = getEnvCandidates(rootDir);

  for (const absolutePath of candidates) {
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const content = fs.readFileSync(absolutePath, ENCODING.utf8);
    parseEnv(content);
  }
}

module.exports = { loadEnv };
