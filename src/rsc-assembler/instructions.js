const { REGISTER, INT } = require('./token-types');

const INSTRUCTION_SIZE = 16;
const OPCODE_SIZE = 4;

class Instruction {

	/**
	 * Parameterized constructor.
	 *
	 * @param opcode {number} The opcode.
	 * @param pattern {TokenType[]} An array specifying the token types that the instruction must follow.
	 */
	constructor(opcode, pattern) {
		this.opcode = opcode;
		this.pattern = pattern;
	}

	/**
	 * Validate the given tokens based on the instruction's pattern.
	 * Returns the first validation error encountered, or null if all tokens are valid.
	 *
	 * @param tokens {string[]} The tokens to validate.
	 * @returns {Error|null} The first validation error encountered, or null if all tokens are valid.
	 */
	validatePattern(tokens) {
		if (tokens.length !== this.pattern.length) {
			return Error(`Too ${ tokens.length > this.pattern.length ? 'many' : 'few' } arguments. Expected ${ this.pattern.length } but got ${ tokens.length }.`);
		}

		return this.pattern
			.map((tokenType, index) => tokenType.validate(tokens[index]))
			.filter(error => error != null)
			.shift() ?? null;
	}

	/**
	 * Generates the machine code of the instruction using the provided tokens.
	 *
	 * @param tokens {string[]} The tokens to be used.
	 * @returns {number} The resulting machine code of the instruction.
	 */
	assemble(tokens) {
		let machineCode = this.opcode;
		let availableBits = INSTRUCTION_SIZE - OPCODE_SIZE;
		this.pattern.forEach((tokenType, index) => {
			machineCode = (machineCode << tokenType.size) | tokenType.assemble(tokens[index]);
			availableBits -= tokenType.size;
		});
		return machineCode << availableBits;
	}
}

const Instructions = Object.freeze({
	NOP: new Instruction(
		0,
		[]
	),
	HLT: new Instruction(
		1,
		[]
	),
	ADD: new Instruction(
		2,
		[REGISTER, REGISTER, REGISTER]
	),
	SUB: new Instruction(
		3,
		[REGISTER, REGISTER, REGISTER]
	),
	NOR: new Instruction(
		4,
		[REGISTER, REGISTER, REGISTER]
	),
	AND: new Instruction(
		5,
		[REGISTER, REGISTER, REGISTER]
	),
	XOR: new Instruction(
		6,
		[REGISTER, REGISTER, REGISTER]
	),
	RSH: new Instruction(
		7,
		[REGISTER, REGISTER]
	),
	LDI: new Instruction(
		8,
		[REGISTER, INT(8)]
	),
	ADI: new Instruction(
		9,
		[REGISTER, INT(8)]
	)
});

module.exports = {
	INSTRUCTION_SIZE,
	Instructions
};