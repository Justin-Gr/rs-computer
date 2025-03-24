const a = require('indefinite');
const { maxUIntValue } = require('../utils/number-utils');

const COMMENT_SYMBOLS = ['#', '//', '--'];
const LABEL_SYMBOL = '.';

class TokenType {

	/**
	 * Parameterized constructor
	 *
	 * @param size {number} The expected size of the token (bits).
	 * @param validator {function(string, ?{[key:string]:number}): Error|null} A function that validates whether a given token matches the token type.
	 * @param assembler {function(string, ?{[key:string]:number}): number} A function that assembles the machine code from the given token.
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
	 * @param labelIndices {{[key:string]:number}} The instruction line index for each known label.
	 * @returns {Error|null} A validation error if the token is invalid, null otherwise.
	 */
	validate(token, labelIndices) {
		return this.validator(token, labelIndices);
	}

	/**
	 * Generates the machine code using the given token.
	 *
	 * @param token {string} The token to be used.
	 * @param labelIndices {{[key:string]:number}} The instruction line index for each known label.
	 * @returns {number} The resulting machine code.
	 */
	assemble(token, labelIndices) {
		return this.assembler(token, labelIndices);
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
const INT = (size, strict = false) => new TokenType(
	size,
	(token) => {
		const tokenNumber = Number(token); // supports 0b and 0x notation
		const maxValue = strict ? maxUIntValue(size - 1) : maxUIntValue(size);

		// 8-bit example with non-strict mode : accepts values from -128 to 255 (unlike strict-mode which only accepts values from -128 to 127)
		// Non-strict mode is a thing because sometimes we only matters about the bit value held by the token
		return !isNaN(tokenNumber) && tokenNumber >= -maxUIntValue(size - 1) - 1 && tokenNumber <= maxValue
			? null
			: new Error(`'${ token }' is not a valid representation of ${ a(size) }-bit ${ strict ? 'signed' : '' } integer.`);
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
const INSTRUCTION_ADDRESS = (() => {
	const size = 10;
	return new TokenType(
		size,
		(token, labelIndices) => {
			// We are looking for either a valid label or a valid direct instruction address.
			let instructionAddress;
			if (token.startsWith(LABEL_SYMBOL)) {
				const label = token.replace(LABEL_SYMBOL, '');
				instructionAddress = labelIndices[label];

				// If no indexed label corresponds to the given label.
				if (instructionAddress == null) {
					return new Error(`Unknown label ${ label }.`);
				}
			}
			else {
				instructionAddress = Number(token);
			}

			return !isNaN(instructionAddress) && instructionAddress >= 0 && instructionAddress <= maxUIntValue(size)
				? null
				: new Error(`${ token } is not a valid representation of ${ a(size) }-bit instruction address.`);
		},
		(token, labelIndices) => {
			if (token.startsWith(LABEL_SYMBOL)) {
				const label = token.replace(LABEL_SYMBOL, '');
				return labelIndices[label];
			}
			else {
				return Number(token);
			}
		}
	);
})();
const FLAG = (() => {
	const size = 2;
	const indexedMnemonics = [
		['z', 'zero', 'eq', '=='],    //   zero -> a == b
		['!z', '!zero', '!eq', '!='], //  !zero -> a != b
		['c', 'carry', 'gt', '>='],   //  carry -> a >= b
		['!c', '!carry', 'lt', '<']   // !carry -> a < b
	];

	return new TokenType(
		size,
		(token) => {
			const tokenNumber = Number(token);
			const isValidNumber = !isNaN(tokenNumber) && tokenNumber >= 0 && tokenNumber <= maxUIntValue(size);
			const isValidMnemonic = indexedMnemonics.some(mnemonics => mnemonics.includes(token.toLowerCase()));

			return isValidNumber || isValidMnemonic
				? null
				: new Error(`${ token } does not match any known flag.`);
		},
		(token) => {
			const tokenNumber = Number(token);
			return !isNaN(tokenNumber)
				? tokenNumber
				: indexedMnemonics.findIndex(mnemonics => mnemonics.includes(token.toLowerCase()));
		}
	);
})();

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