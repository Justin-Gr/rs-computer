const { assembleRscToMachineCode } = require('./rsc-assembler/rsc-assembler');
const { binaryRepresentation } = require('./utils/number-utils');
const { INSTRUCTION_SIZE } = require('./rsc-assembler/instructions');
const { generateSchemFromMachineCode } = require('./schem-generator/schem-generator');

const FILENAME = 'test';
const RSC_PATH = `./programs/${ FILENAME }.rsc`;
const SCHEM_PATH = `./build/${ FILENAME }.schem`;

async function main() {
	try {
		const machineCode = await assembleRscToMachineCode(RSC_PATH);

		// Pretty print
		const machineCodePretty = machineCode
			.map(machineCodeLine => binaryRepresentation(machineCodeLine, INSTRUCTION_SIZE))
			.join('\n');
		console.log(machineCodePretty);

		await generateSchemFromMachineCode(machineCode, SCHEM_PATH);
	}
	catch (error) {
		console.error(error);
	}
}

main();