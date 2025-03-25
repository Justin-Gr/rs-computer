// Registers init
LDI r1 222
LDI r2 73
LDI r3 39
LDI r4 214
LDI r5 155

LDI r6 5 // i (array length)
LDI r7 0 // j
LDI r8 0 // a
LDI r9 0 // b

// Memory init
WRT r1 r0 0
WRT r2 r0 1
WRT r3 r0 2
WRT r4 r0 3
WRT r5 r0 4

// Bubble sort
.i_loop
	LDI r7 1 // 1 → j
	.j_loop
		RED r8 r7 -1 // Data[j-1] → a
		RED r9 r7 0  // Data[j]   → b
		CMP r9 r8    // Compares b with a
		BRC >= .skip // If b >= a, no need to swap
			// Swap case
			WRT r8 r7 0  // a → Data[j]
			WRT r9 r7 -1 // b → Data[j-1]
		.skip
		INC r7        // j++
		CMP r7 r6     // Compares j with i
		BRC < .j_loop // While j < i

	// While --i != 0
	DEC r6
	BRC != .i_loop

HLT