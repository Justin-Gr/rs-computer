const MC_VERSION = '1.18.2';

const fs = require('fs').promises;
const { Schematic } = require('prismarine-schematic');
const { Vec3 } = require('vec3');
const { INSTRUCTION_SIZE } = require('../rsc-assembler/instructions');
const { maxUIntValue } = require('../utils/number-utils');
const registry = require('prismarine-registry')(MC_VERSION);
const Block = require('prismarine-block')(registry);

const WOOL_BLOCK = Block.fromString('minecraft:magenta_wool', 0);
const REPEATER_BLOCK = Block.fromString('minecraft:repeater[facing=north,locked=false,powered=false]', 0);

const SCHEM_AREA = new Vec3(133, 32, 91);
const BASE_OFFSET = new Vec3(-66, -1, 0);
const FINAL_OFFSET = new Vec3(0, -32, 2);

const INSTRUCTION_BITS_Y_SPACE = 2;
const ADDRESSES_X_SPACE = 2;
const ADDRESSES_X_OFFSET = 4
const PAGES_Z_SPACE = 6;

const PAGE_ADDRESS_SIZE = 5;
const SIDE_SIZE = 1;
const PAGE_SIZE = 4;
const ADDRESS_STRUCTURE = [PAGE_ADDRESS_SIZE, SIDE_SIZE, PAGE_SIZE];
const ADDRESS_SIZE = ADDRESS_STRUCTURE.reduce((sum, value) => sum + value, 0);
const MAX_INSTRUCTION_COUNT = maxUIntValue(ADDRESS_SIZE) + 1;

/**
 * Generate a .schem file from the given machine code.
 * Must be pasted using the -as flags (-a to ignore air blocks, -s to select the area before manually //update it).
 *
 * @param machineCode {number[]} The machine code to generate the .schem file from.
 * @param schemPath {string} The path of the .schem file to write.
 * @returns {Promise<void>} A promise that resolves when the .schem file has been successfully written.
 */
async function generateSchemFromMachineCode(machineCode, schemPath) {
	if (machineCode.length > MAX_INSTRUCTION_COUNT) {
		throw new Error(`Too many instructions (${ machineCode.length }/${ MAX_INSTRUCTION_COUNT }), cannot generate .schem file.`);
	}

	// Schematic initialization (filled with air blocks)
	const emptyArea = new Array(SCHEM_AREA.volume()).fill(0);
	const schematic = new Schematic(MC_VERSION, SCHEM_AREA, BASE_OFFSET, [0], emptyArea);

	// Schematic definition
	machineCode.forEach((instruction, address) => {
		const [pageAddress, side, page] = readPartsOfAddress(address, ADDRESS_STRUCTURE);
		const instructionPosition = calculateInstructionPosition(pageAddress, side, page);
		writeInstruction(schematic, instructionPosition, instruction);
		console.log(`Instruction ${ address + 1 }/${ machineCode.length } written`);
	});

	// Final offset
	schematic.offset.add(FINAL_OFFSET);

	// Save the schematic
	await fs.writeFile(schemPath, await schematic.write());
	console.log(`Saved .schem file to ${ schemPath }`);
}

/**
 * Extract multiple parts of an address according to the specified structure.
 * This structure consists of an array indicating the bit size of each part to extract.
 *
 * For example :
 * readPartsOfAddress(0b1101011010, [5, 1, 4]) returns [0b11010, 0b1, 0b1010]
 *
 * @param address {number} The address to extract the parts from.
 * @param partsStructure {number[]} An array indicating the bit size of each part to extract.
 * @returns {number[]} The extracted parts of the address.
 */
function readPartsOfAddress(address, partsStructure) {
	const addressParts = [];
	[...partsStructure] // Clones the structure to avoid mutating the original when using reverse()
		.reverse()
		.reduce((offset, partSize) => {
			addressParts.unshift(readPartOfAddress(address, partSize, offset));
			return offset + partSize;
		}, 0);
	return addressParts;
}

/**
 * Extract a part of an address by reading a specified number of bits starting from a given offset.
 *
 * @param address {number} The address to extract the bits from.
 * @param bits {number} The number of bits to extract from the address.
 * @param offset {number} The offset to start reading the bits from (starting from LSB).
 * @returns {number} The extracted part of the address.
 */
function readPartOfAddress(address, bits, offset) {
	const mask = maxUIntValue(bits) << offset;
	return (address & mask) >>> offset;
}

/**
 * Calculate the starting position of an instruction based on its page address, its side and its page.
 *
 * @param pageAddress {number} The page address of the instruction.
 * @param side {number} The side of the instruction.
 * @param page {number} The page of the instruction.
 * @returns {Vec3} The starting position of the instruction.
 */
function calculateInstructionPosition(pageAddress, side, page) {
	const x = pageAddress * ADDRESSES_X_SPACE + ADDRESSES_X_OFFSET;
	const z = page * PAGES_Z_SPACE;
	return new Vec3(side === 0 ? x : -x, 0, z);
}

/**
 * Write the given instruction as a column of blocks into the schematic at the given position.
 *
 * Each bit of the instruction is represented as blocks:
 * - A repeater block for a 1 bit.
 * - A wool block for a 0 bit.
 *
 * The LSB is located at the bottom of the column, while the MSB is at the top.
 *
 * @param schematic {Schematic} The schematic to write the instruction into.
 * @param position {Vec3} The starting position to write the instruction.
 * @param instruction {number} The instruction to write.
 */
function writeInstruction(schematic, position, instruction) {
	const bitPosition = position.clone();

	for (let i = 0; i < INSTRUCTION_SIZE; i++) {
		if (instruction & 1) {
			schematic.setBlock(bitPosition, REPEATER_BLOCK);
		}
		else {
			schematic.setBlock(bitPosition, WOOL_BLOCK);
		}
		schematic.setBlock(bitPosition.offset(0, -1, 0), WOOL_BLOCK);

		bitPosition.translate(0, INSTRUCTION_BITS_Y_SPACE, 0);
		instruction >>= 1;
	}
}

module.exports = {
	generateSchemFromMachineCode
};