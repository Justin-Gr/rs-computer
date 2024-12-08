const { extractLinesFromFile } = require('../utils/file-utils');
const { Instructions } = require('./instructions');
const { isNotBlank } = require('../utils/string-utils');

const COMMENT_SYMBOLS = ['#', '//', '--'];

/**
 * Read the content of the given RSC program and assemble it to machine code.
 *
 * @param rscFilename {string} The RSC program filename.
 * @returns {Promise<number[]>} The resulting machine code.
 */
async function assembleRscToMachineCode(rscFilename) {
	const lines = await extractLinesFromFile(rscFilename);

	const cleanedLines = lines
		.map(line => {
			// Removing all comments.
			COMMENT_SYMBOLS.forEach(commentSymbol => {
				line = line.split(commentSymbol)[0].trim();
			});
			return line;
		})
		.filter(line => isNotBlank(line)); // Removing blank lines.

	return cleanedLines
		.map((line, index) => {
			const tokens = line.split(/\s+/); // split by spaces
			const instructionToken = tokens.shift();
			const instruction = Instructions[instructionToken.toUpperCase()];
			if (instruction == null) {
				throw new Error(`at line ${ index + 1 }: '${ instructionToken }' does not match any known instruction.`);
			}

			const error = instruction.validatePattern(tokens);
			if (error != null) {
				throw new Error(`at line ${ index + 1 }: ${ error.message }`);
			}

			return instruction.assemble(tokens);
		});
}

module.exports = {
	assembleRscToMachineCode
};