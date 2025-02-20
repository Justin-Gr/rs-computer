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
	 * @param labelIndices {{[key:string]:number}} The instruction line index for each known label.
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
	 * @param labelIndices {{[key:string]:number}} The instruction line index for each known label.
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
	 * @param labelIndices {{[key:string]:number}} The instruction line index for each known label.
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
	 * @param labelIndices {{[key:string]:number}} The instruction line index for each known label.
	 * @returns {number} The resulting machine code of the pseudo-instruction.
	 */
	assemble(tokens, labelIndices) {
		const adaptedTokens = this.tokenAdapter(tokens);
		return this.baseInstruction.assemble(adaptedTokens, labelIndices);
	}
}

/**
 * @type {{[key:string]:Instruction}}
 */
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
		2,                             // W ← RA + RB
		[REGISTER, REGISTER, REGISTER] // [W, RA, RB]
	),
	SUB: new Instruction(
		3,                             // W ← RA - RB
		[REGISTER, REGISTER, REGISTER] // [W, RA, RB]
	),
	NOR: new Instruction(
		4,                             // W ← !(RA | RB)
		[REGISTER, REGISTER, REGISTER] // [W, RA, RB]
	),
	AND: new Instruction(
		5,                             // W ← RA & RB
		[REGISTER, REGISTER, REGISTER] // [W, RA, RB]
	),
	XOR: new Instruction(
		6,                             // W ← RA ^ RB
		[REGISTER, REGISTER, REGISTER] // [W, RA, RB]
	),
	RSH: new Instruction(
		7,                   // W ← RA >> 1
		[REGISTER, REGISTER] // [W, RA]
	),
	LDI: new Instruction(
		8,                      // W ← Value
		[REGISTER, INT(8)] // [W, Value]
	),
	ADI: new Instruction(
		9,                      // W ← W + Value
		[REGISTER, INT(8)] // [W, Value]
	),
	JMP: new Instruction(
		10,                                  // PC ← Address
		[BLANK(2), INSTRUCTION_ADDRESS] // [void, Address]
	),
	BRC: new Instruction(
		11,                         // If Flag then PC ← Address
		[FLAG, INSTRUCTION_ADDRESS] // [Flag, Address]
	)
};
/**
 * @type {{[key:string]:PseudoInstruction}}
 */
const PseudoInstructions = {
	MOV: new PseudoInstruction(      // W ← RA
		Instructions.ADD,            // W ← RA + R0
		[REGISTER, REGISTER], // [W, RA]
		([writeRegister, registerA]) => [writeRegister, registerA, 'r0']
	),
	INC: new PseudoInstruction(      // W++
		Instructions.ADI,            // W ← W + 1
		[REGISTER],           // [W]
		([writeRegister]) => [writeRegister, '1']
	),
	DEC: new PseudoInstruction(      // W--
		Instructions.ADI,            // W ← W - 1
		[REGISTER],           // [W]
		([writeRegister]) => [writeRegister, '-1']
	),
	CMP: new PseudoInstruction(      // Compares RA and RB
		Instructions.SUB,            // R0 ← RA - RB
		[REGISTER, REGISTER], // [RA, RB]
		([registerA, registerB]) => ['r0', registerA, registerB]
	),
	LSH: new PseudoInstruction(      // W ← RA << 1
		Instructions.ADD,            // W ← RA + RA
		[REGISTER, REGISTER], // [W, RA]
		([writeRegister, registerA]) => [writeRegister, registerA, registerA]
	),
	NOT: new PseudoInstruction(      // W ← !RA
		Instructions.XOR,            // W ← RA ^ 0xFF
		[REGISTER, REGISTER], // [W, RA]
		([writeRegister, registerA]) => [writeRegister, registerA, '0xFF']
	),
	NEG: new PseudoInstruction(      // W ← -RA
		Instructions.SUB,            // W ← R0 - RA
		[REGISTER, REGISTER], // [W, RA]
		([writeRegister, registerA]) => [writeRegister, 'r0', registerA]
	)
};

module.exports = {
	INSTRUCTION_SIZE,
	Instructions: Object.freeze(Object.assign({}, Instructions, PseudoInstructions))
};