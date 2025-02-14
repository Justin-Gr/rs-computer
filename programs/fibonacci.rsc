// Init
LDI r1 1 // U(n-2)
LDI r2 1 // U(n-1)
LDI r3 1 // U(n) = U(n-1) + U(n-2)
LDI r4 8 // n

// if n < 3, we know the result is 1
ADI r4 -3
BRC < .end

.loop
ADD r3 r1 r2 // U(n) = U(n-2) + U(n-1)
ADD r1 r2 r0 // r1 ← r2
ADD r2 r3 r0 // r2 ← r3

ADI r4 -1 // n--
BRC >= .loop // while n >= 0

.end HLT