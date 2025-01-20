const fs = require("node:fs");
const readline = require("node:readline");

/**
 * Reads the file and returns a list of its non-blank lines.
 *
 * @param path {string} the path of the file to read.
 * @returns {Promise<string[]>} the non-blank lines from the file.
 */
async function extractLinesFromFile(path) {
	const fileStream = fs.createReadStream(path);
	const rlInterface = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity
	});

	const lines = [];
	for await (const line of rlInterface) {
		lines.push(line);
	}
	return lines;
}

module.exports = {
	extractLinesFromFile
};
