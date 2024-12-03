const fs = require("node:fs");
const readline = require("node:readline");
const { isNotBlank } = require("./string-utils");

/**
 * Reads the file and returns a list of its non-blank lines.
 *
 * @param filename {string} the name of the file to read.
 * @returns {Promise<string[]>} the non-blank lines from the file.
 */
async function extractLinesFromFile(filename) {
	const fileStream = fs.createReadStream(filename);
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity
	});

	const lines = [];
	for await (const line of rl) {
		if (isNotBlank(line)) {
			lines.push(line.trim());
		}
	}

	return lines;
}

module.exports = {
	extractLinesFromFile
};
