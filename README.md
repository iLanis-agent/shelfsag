# ShelfSag

Shelf sag calculator: uniform load on a board of given length, depth, thickness and material.

- Resting on two supports: sag = 5wL^4 / (384 E I)
- Both ends fixed: sag = wL^4 / (384 E I)
- Cantilever tip: sag = wL^4 / (8 E I)
- I = depth x thickness^3 / 12, load includes the board's own weight
- Limit L/300 (rule of thumb), long-term sag x2 (creep allowance, rule of thumb)

Material stiffness and density are typical values and real boards vary. Static client-side. `node test-engine.js` runs the tests.

Source for formulas: https://civilsguide.com/beam-deflection-formula-tables/
