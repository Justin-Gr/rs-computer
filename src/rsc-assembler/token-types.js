const a = require('indefinite');
const { maxUIntValue } = require('../utils/number-utils');

const COMMENT_SYMBOLS = ['#', '//', '--'];
const LABEL_SYMBOL = '.';

class TokenType {

	/**
	 * Parameterized constructor
	 *
	 * @param size {number} The expected size of the token (bits).
	 * @param validator {function(string,?{string:number}):Error|null} A function that validates whether a given token matches the token type.
	 * @param assembler {function(string,?{string:number}):number} A function that assembles the machine code from the given token.
	 * @param consumeToken {?boolean} Indicates if the tokenType consumes a token when used in an instruction.
	 */
	constructor(size, validator, assembler, consumeToken = true) {
		this.size = size;
		this.validator = validator;
		this.assembler = assembler;
		this.consumeToken = consumeToken;
	}

	/**
	 * Validate the given token based on the token type.
	 * If the token is invalid, it returns an error. Otherwise, it returns null.
	 *
	 * @param token {string} The token to validate.
	 * @param labelsIndex {{string:number}} TODO JGN
	 * @returns {Error|null} A validation error if the token is invalid, null otherwise.
	 */
	validate(token, labelsIndex) {
		return this.validator(token, labelsIndex);
	}

	/**
	 * Generates the machine code using the given token.
	 *
	 * @param token {string} The token to be used.
	 * @param labelsIndex {{string:number}} TODO JGN
	 * @returns {number} The resulting machine code.
	 */
	assemble(token, labelsIndex) {
		return this.assembler(token, labelsIndex);
	}
}

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
const BLANK = (size) => new TokenType(
	size,
	() => null,
	() => 0,
	false
);
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
const INSTRUCTION_ADDRESS = new TokenType(
	10,
	(token, labelsIndex) => {
		let instructionAddress;
		if (token.startsWith(LABEL_SYMBOL)) {
			const label = token.replace(LABEL_SYMBOL, '');
			instructionAddress = labelsIndex[label];

			if (instructionAddress == null) {
				return new Error(`Unknown label ${ label }.`);
			}
		}
		else {
			instructionAddress = Number(token);
		}

		return !isNaN(instructionAddress) && instructionAddress >= 0 && instructionAddress <= maxUIntValue(10)
			? null
			: new Error(`${ token } is not a valid representation of a 10-bit instruction address.`);
	},
	(token, labelsIndex) => {
		if (token.startsWith(LABEL_SYMBOL)) {
			const label = token.replace(LABEL_SYMBOL, '');
			return labelsIndex[label];
		}
		else {
			return Number(token);
		}
	}
);
// TODO JGN
const FLAG = new TokenType(
	2,
	(token) => {
	},
	(token) => {
	}
);

module.exports = {
	COMMENT_SYMBOLS,
	LABEL_SYMBOL,
	UINT,
	INT,
	BLANK,
	REGISTER,
	INSTRUCTION_ADDRESS,
	FLAG
};