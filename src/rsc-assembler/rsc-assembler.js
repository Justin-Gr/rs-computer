const { extractLinesFromFile } = require('../utils/file-utils');
const { Instructions } = require('./instructions');
const { isNotBlank } = require('../utils/string-utils');
const { COMMENT_SYMBOLS, LABEL_SYMBOL } = require('./token-types');

/**
 * Read the content of the given RSC program and assemble it to machine code.
 *
 * @param rscPath {string} The RSC program file path.
 * @returns {Promise<number[]>} The resulting machine code.
 */
async function assembleRscToMachineCode(rscPath) {
	const lines = await extractLinesFromFile(rscPath);

	const cleanedLines = lines
		.map(line => line.trim())
		.map(line => {
			// Removing all comments.
			COMMENT_SYMBOLS.forEach(commentSymbol => {
				line = line.split(commentSymbol)[0].trim();
			});
			return line;
		})
		.filter(line => isNotBlank(line)); // Removing blank lines.

	// Labels indexing
	const labelIndices = {};
	const instructionLines = [];
	cleanedLines.forEach((line, lineIndex) => {
		if (!line.startsWith(LABEL_SYMBOL)) {
			instructionLines.push(line);
			return;
		}

		const tokens = line.split(/\s+/); // split by spaces
		const label = tokens.shift().replace(LABEL_SYMBOL, '');

		// Labels must be unique.
		if (labelIndices[label] != null) {
			throw new Error(`at line ${ lineIndex + 1 }: Label ${ label } has already been defined.`);
		}

		labelIndices[label] = instructionLines.length;
		// If there are some tokens left, we put them back (happens when the label is on the beginning of a line).
		if (tokens.length > 0) {
			instructionLines.push(tokens.join(' '));
		}
	});

	return instructionLines
		.map((line, lineIndex) => {
			const tokens = line.split(/\s+/); // split by spaces

			const instructionToken = tokens.shift();
			const instruction = Instructions[instructionToken.toUpperCase()];
			if (instruction == null) {
				throw new Error(`at line ${ lineIndex + 1 }: '${ instructionToken }' does not match any known instruction.`);
			}

			const error = instruction.validatePattern(tokens, labelIndices);
			if (error != null) {
				throw new Error(`at line ${ lineIndex + 1 }: ${ error.message }`);
			}

			return instruction.assemble(tokens, labelIndices);
		});
}

module.exports = {
	assembleRscToMachineCode
};