const a = require('indefinite');
const { maxUIntValue } = require('../utils/number-utils');

class TokenType {

	/**
	 * Parameterized constructor
	 *
	 * @param size {number} The expected size of the token (bits).
	 * @param validator {function(string):Error|null} A function that validates whether a given token matches the token type.
	 * @param machineCodeGenerator {function(string):number} A function that generates the machine code from the given token.
	 */
	constructor(size, validator, machineCodeGenerator) {
		this.size = size;
		this.validator = validator;
		this.machineCodeGenerator = machineCodeGenerator;
	}

	/**
	 * Validate the given token based on the token type.
	 * If the token is invalid, it returns an error. Otherwise, it returns null.
	 *
	 * @param token {string} The token to validate.
	 * @returns {Error|null} A validation error if the token is invalid, null otherwise.
	 */
	validate(token) {
		return this.validator(token);
	}

	/**
	 * Generates the machine code using the given token.
	 *
	 * @param token {string} The token to be used.
	 * @returns {number} The resulting machine code.
	 */
	assemble(token) {
		return this.machineCodeGenerator(token);
	}
}

const REGISTER = new TokenType(
	4,
	(token) => {
		const regex = /^R(1[0-5]|[0-9])$/; // from r0 to r15
		return regex.test(token.toUpperCase())
			? null
			: new Error(`'${ token }' does not match any known register.`);
	},
	(token) => {
		return Number(token.slice(1)); // r15 → 15
	}
);
const UINT = (size) => new TokenType(
	size,
	(token) => {
		const tokenNumber = Number(token); // supports 0b and 0x notation
		return !isNaN(tokenNumber) && tokenNumber >= 0 && tokenNumber <= maxUIntValue(size)
			? null
			: new Error(`'${ token }' is not a valid representation of ${ a(size) }-bit unsigned integer.`);
	},
	(token) => {
		return Number(token);
	}
);
const INT = (size) => new TokenType(
	size,
	(token) => {
		const tokenNumber = Number(token); // supports 0b and 0x notation
		// 8-bit example : accepts values from -128 to 255 (not just -128 to 127)
		// What matters is the bit value held by the token
		return !isNaN(tokenNumber) && tokenNumber >= -maxUIntValue(size - 1) - 1 && tokenNumber <= maxUIntValue(size)
			? null
			: new Error(`'${ token }' is not a valid representation of ${ a(size) }-bit integer.`);
	},
	(token) => {
		const value = Number(token)
		// Trick to force the value to be read as an unsigned int of the correct size
		return (value & maxUIntValue(size)) >>> 0;
	}
);

module.exports = {
	REGISTER,
	UINT,
	INT
};