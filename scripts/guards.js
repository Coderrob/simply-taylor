/**
 * Shared runtime type guards for Node and browser scripts.
 */

(function initializeGuards(globalScope) {
  "use strict";

  const OBJECT_TAGS = {
    string: "[object String]",
    boolean: "[object Boolean]",
    function: "[object Function]",
    object: "[object Object]",
  };

  /**
   * Checks whether a value is a string.
   *
   * @param {unknown} value Value to evaluate.
   * @returns {boolean} True when value is a string primitive.
   * @throws {Error} Never intentionally throws.
   */
  function isString(value) {
    return Object.prototype.toString.call(value) === OBJECT_TAGS.string;
  }

  /**
   * Checks whether a value is a boolean.
   *
   * @param {unknown} value Value to evaluate.
   * @returns {boolean} True when value is a boolean primitive.
   * @throws {Error} Never intentionally throws.
   */
  function isBoolean(value) {
    return Object.prototype.toString.call(value) === OBJECT_TAGS.boolean;
  }

  /**
   * Checks whether a value is a function.
   *
   * @param {unknown} value Value to evaluate.
   * @returns {boolean} True when value is callable.
   * @throws {Error} Never intentionally throws.
   */
  function isFunction(value) {
    return Object.prototype.toString.call(value) === OBJECT_TAGS.function;
  }

  /**
   * Checks whether a value is a non-null object.
   *
   * @param {unknown} value Value to evaluate.
   * @returns {boolean} True when value is a plain object or object instance.
   * @throws {Error} Never intentionally throws.
   */
  function isObject(value) {
    return (
      value !== null &&
      Object.prototype.toString.call(value) === OBJECT_TAGS.object
    );
  }

  /**
   * Checks whether a value is neither null nor undefined.
   *
   * @param {unknown} value Value to evaluate.
   * @returns {boolean} True when value is present.
   * @throws {Error} Never intentionally throws.
   */
  function isPresent(value) {
    return value !== null && value !== undefined;
  }

  /**
   * Checks whether an object has a callable property at key.
   *
   * @param {unknown} value Object candidate.
   * @param {string} key Property name to test.
   * @returns {boolean} True when value[key] exists and is callable.
   * @throws {Error} Never intentionally throws.
   */
  function hasFunction(value, key) {
    if (!isPresent(value) || !isString(key)) {
      return false;
    }

    return isFunction(value[key]);
  }

  const guards = {
    isString,
    isBoolean,
    isFunction,
    isObject,
    isPresent,
    hasFunction,
  };

  try {
    module.exports = guards;
  } catch (_error) {
    // Ignore in browser environments where module is unavailable.
  }

  if (globalScope) {
    globalScope.ScriptGuards = guards;
  }
})(globalThis);
