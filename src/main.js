const { assembleRscToMachineCode } = require('./rsc-assembler/rsc-assembler');
const { binaryRepresentation } = require('./utils/string-utils');
const { INSTRUCTION_SIZE } = require('./rsc-assembler/instructions');

const FILENAME = 'test';
const RSC_FILENAME = `./programs/${ FILENAME }.rsc`;
const SCHEM_FILENAME = `./build/${ FILENAME }.schem`;

async function main() {
	try {
		const machineCode = await assembleRscToMachineCode(RSC_FILENAME);

		// Pretty print
		const machineCodePretty = machineCode
			.map(machineCodeLine => binaryRepresentation(machineCodeLine, INSTRUCTION_SIZE))
			.join('\n');
		console.log(machineCodePretty);

		// await generateSchemFromMachineCode(machineCode, SCHEM_FILENAME);
	}
	catch (error) {
		console.error(error);
	}
}

main();