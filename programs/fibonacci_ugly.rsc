// Init with ADI
ADI r1 1
ADI r2 1

// Dumb Fibonacci sequence
ADD r3 r1 r2 // r3 ← 2 = 1 + 1
ADD r4 r2 r3 // r4 ← 3 = 1 + 2
ADD r5 r3 r4 // r5 ← 5 = 2 + 3
ADD r6 r4 r5 // r6 ← 8 = 3 + 5
ADD r7 r5 r6 // r7 ← 13 = 5 + 8
ADD r8 r6 r7 // r8 ← 21 = 13 + 8

// Another ADI test
ADI r8 -1 // r8 ← 20 = 21 - 1
HLT