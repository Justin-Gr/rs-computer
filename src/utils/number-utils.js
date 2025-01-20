/**
 * Converts the given number to its binary representation as a string.
 *
 * @param value {number} The number to convert.
 * @param size {number} The size of the desired binary representation (in bits).
 * @returns {string} The binary representation of the given number.
 */
function binaryRepresentation(value, size = 32) {
	// The unsigned right shift trick allows to handle negative values properly
	const unsignedValue = (value & maxUIntValue(size)) >>> 0;
	return unsignedValue.toString(2).padStart(size, '0');
}

/**
 * Returns the maximum unsigned integer value for the specified number of bits.
 * Since bitwise operations in JS are limited to 32 bits, this method is not intended to produce values larger than 32 bits.
 *
 * @param bits {number} The number of bits (supports values from 0 to 32).
 * @returns {number} The maximum unsigned integer value for the specified number of bits.
 */
function maxUIntValue(bits) {
	return bits < 32
		? (1 << bits) - 1
		: 0xFFFFFFFF;
}

module.exports = {
	binaryRepresentation,
	maxUIntValue
}