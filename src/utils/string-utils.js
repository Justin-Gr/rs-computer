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

/**
 * Converts the given number to its binary representation as a string.
 *
 * @param value {number} The number to convert.
 * @param leadingZeros {number} The maximum number of leading zeros for the binary representation.
 * @returns {string} The binary representation of the given number.
 */
function binaryRepresentation(value, leadingZeros = 0) {
	return value.toString(2).padStart(leadingZeros, '0');
}

module.exports = {
	isBlank,
	isNotBlank,
	binaryRepresentation
};