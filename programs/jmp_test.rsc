.init
LDI r1 0
LDI r2 3

.loop ADD r1 r1 r2
JMP .loop

.test ADI r2 1
HLT