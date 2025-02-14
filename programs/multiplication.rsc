// Init
LDI r1 7 // A
LDI r2 6 // B
LDI r3 0 // A * B

.loop
ADD r3 r3 r1
ADI r2 -1
BRC !zero .loop

HLT