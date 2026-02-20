# Fold Circuit

Fold Circuit is a deterministic power-routing puzzle.

Gameplay loop:
1. Place wires from source to sink.
2. Run simulation under current law set.
3. Solve with low active-cell count.
4. Advance and accept one law mutation.

Architecture notes:
- Canvas2D renders board state.
- DOM overlay provides touch and keyboard interaction.
- Typed-array simulation and bounded solver preserve deterministic behavior.
- Puzzle generator validates solvability under active laws before accepting a board.
