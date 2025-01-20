/**
 * Indicates if the given string is blank.
 *
 * @param str The given string.
 * @returns {boolean} True if the given string is blank.
 */
function isBlank(str) {
	return str?.trim().length === 0;
}

/**
 * Indicates if the given string is not blank.
 *
 * @param str The given string.
 * @returns {boolean} True if the given string is not blank.
 */
function isNotBlank(str) {
	return !isBlank(str);
}

module.exports = {
	isBlank,
	isNotBlank
};