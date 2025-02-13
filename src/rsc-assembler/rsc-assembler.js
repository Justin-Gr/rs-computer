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
	const labeledLines = [];
	const labelsIndex = {};
	cleanedLines.forEach((line, lineIndex) => {
		if (!line.startsWith(LABEL_SYMBOL)) {
			labeledLines.push(line);
			return;
		}

		const tokens = line.split(/\s+/);
		const label = tokens.shift().replace(LABEL_SYMBOL, '');

		if (labelsIndex[label] != null) {
			throw new Error(`at line ${ lineIndex + 1 }: Label ${ label } has already been defined.`);
		}

		labelsIndex[label] = labeledLines.length;
		if (tokens.length > 0) {
			labeledLines.push(tokens.join(' '));
		}
	});

	return labeledLines
		.map((line, lineIndex) => {
			const tokens = line.split(/\s+/); // split by spaces
			const instructionToken = tokens.shift();
			const instruction = Instructions[instructionToken.toUpperCase()];
			if (instruction == null) {
				throw new Error(`at line ${ lineIndex + 1 }: '${ instructionToken }' does not match any known instruction.`);
			}

			const error = instruction.validatePattern(tokens, labelsIndex);
			if (error != null) {
				throw new Error(`at line ${ lineIndex + 1 }: ${ error.message }`);
			}

			return instruction.assemble(tokens, labelsIndex);
		});
}

module.exports = {
	assembleRscToMachineCode
};