// Init
LDI r1 1 // U(n-2)
LDI r2 1 // U(n-1)
LDI r3 1 // U(n) ← U(n-1) + U(n-2)
LDI r4 8 // n

// if n < 3, the result is 1
ADI r4 -3
BRC < .end

.loop
ADD r3 r1 r2 // U(n) ← U(n-2) + U(n-1)
MOV r1 r2 // r1 ← r2
MOV r2 r3 // r2 ← r3

DEC r4 // n--
BRC >= .loop // while n >= 0

.end HLT