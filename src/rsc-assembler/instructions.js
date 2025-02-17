const { REGISTER, INT, BLANK, INSTRUCTION_ADDRESS, FLAG } = require('./token-types');

const INSTRUCTION_SIZE = 16;
const OPCODE_SIZE = 4;

class AbstractInstruction {

	/**
	 * Parameterized constructor.
	 *
	 * @param pattern {TokenType[]} An array specifying the token types that the instruction must follow.
	 */
	constructor(pattern) {
		this.pattern = pattern;
	}

	/**
	 * Validate the given tokens based on the instruction's pattern.
	 * Returns the first validation error encountered, or null if all tokens are valid.
	 *
	 * @param tokens {string[]} The tokens to validate.
	 * @param labelIndices {{string:number}} The instruction line index for each known label.
	 * @returns {Error|null} The first validation error encountered, or null if all tokens are valid.
	 */
	validatePattern(tokens, labelIndices) {
		const expectedPattern = this.pattern.filter(tokenType => tokenType.consumeToken);

		if (tokens.length !== expectedPattern.length) {
			return Error(`Too ${ tokens.length > expectedPattern.length ? 'many' : 'few' } arguments. Expected ${ expectedPattern.length } but got ${ tokens.length }.`);
		}

		return expectedPattern
			.map((tokenType, index) => tokenType.validate(tokens[index], labelIndices))
			.filter(error => error != null)
			.shift() ?? null;
	}

	/**
	 * Assemble the machine code of the instruction using the provided tokens.
	 *
	 * @abstract
	 * @param tokens {string[]} The tokens to be used.
	 * @param labelIndices {{string:number}} The instruction line index for each known label.
	 * @returns {number} The resulting machine code of the instruction.
	 */
	assemble(tokens, labelIndices){
		throw new Error('Must be implemented by subclasses.');
	}
}

class Instruction extends AbstractInstruction {

	/**
	 * Parameterized constructor.
	 *
	 * @param opcode {number} The opcode.
	 * @param pattern {TokenType[]} An array specifying the token types that the instruction must follow.
	 */
	constructor(opcode, pattern) {
		super(pattern);
		this.opcode = opcode;
	}

	/**
	 * Assemble the machine code of the instruction using the provided tokens.
	 *
	 * @param tokens {string[]} The tokens to be used.
	 * @param labelIndices {{string:number}} The instruction line index for each known label.
	 * @returns {number} The resulting machine code of the instruction.
	 */
	assemble(tokens, labelIndices) {
		let machineCode = this.opcode;
		let availableBits = INSTRUCTION_SIZE - OPCODE_SIZE;
		const remainingTokens = [...tokens]; // Clones the token array
		this.pattern.forEach(tokenType => {
			const token = tokenType.consumeToken ? remainingTokens.shift() : null;
			machineCode = (machineCode << tokenType.size) | tokenType.assemble(token, labelIndices);
			availableBits -= tokenType.size;
		});
		return machineCode << availableBits;
	}
}

class PseudoInstruction extends AbstractInstruction {

	/**
	 * Parameterized constructor.
	 *
	 * @param baseInstruction {Instruction} The base instruction corresponding to the pseudo-instruction.
	 * @param pattern {TokenType[]} An array specifying the token types that the instruction must follow.
	 * @param tokenAdapter {function(string[]):string[]} An adapter that transforms the tokens of the pseudo-instruction to those needed by its corresponding base instruction.
	 */
	constructor(baseInstruction, pattern, tokenAdapter) {
		super(pattern);
		this.baseInstruction = baseInstruction;
		this.tokenAdapter = tokenAdapter;
	}

	/**
	 * Assembles the machine code of the pseudo-instruction by adapting the provided tokens
	 * and delegating the assembly process to its base instruction.
	 *
	 * @param tokens {string[]} The tokens to be used.
	 * @param labelIndices {{string:number}} The instruction line index for each known label.
	 * @returns {number} The resulting machine code of the pseudo-instruction.
	 */
	assemble(tokens, labelIndices) {
		const adaptedTokens = this.tokenAdapter(tokens);
		return this.baseInstruction.assemble(adaptedTokens, labelIndices);
	}
}

const Instructions = {
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
	),
	JMP: new Instruction(
		10,
		[BLANK(2), INSTRUCTION_ADDRESS]
	),
	BRC: new Instruction(
		11,
		[FLAG, INSTRUCTION_ADDRESS]
	)
};
const PseudoInstructions = {
	LDR: new PseudoInstruction(
		Instructions.ADD,
		[REGISTER, REGISTER],
		([writeRegister, registerA]) => [writeRegister, registerA, 'r0']
	),
	INC: new PseudoInstruction(
		Instructions.ADI,
		[REGISTER],
		([writeRegister]) => [writeRegister, '1']
	),
	DEC: new PseudoInstruction(
		Instructions.ADI,
		[REGISTER],
		([writeRegister]) => [writeRegister, '-1']
	),
	CMP: new PseudoInstruction(
		Instructions.SUB,
		[REGISTER, REGISTER],
		([registerA, registerB]) => ['r0', registerA, registerB]
	)
};

module.exports = {
	INSTRUCTION_SIZE,
	Instructions: Object.freeze(Object.assign({}, Instructions, PseudoInstructions))
};