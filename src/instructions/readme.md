# Execution

- read opcode (PC++)
- if opcode == 0xCB, read next opcode (PC++) and look for prefixed instructions
- execute instruction