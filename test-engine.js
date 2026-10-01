var E = require('./engine.js'), n = 0, bad = 0;
function eq(a, b, m, tol) { if (a === b) { n++; return; } n++; tol = tol == null ? 1e-9 : tol; if (!(Math.abs(a - b) <= tol)) { bad++; console.log('FAIL', m, a, b); } }
// textbook formulas: simply supported 5wL^4/384EI, fixed-fixed wL^4/384EI, cantilever wL^4/8EI
var w = 1000, L = 2, Epa = 200e9, I = 8e-6;
eq(E.deflection('simple', w, L, Epa, I), 5 * w * Math.pow(L, 4) / (384 * Epa * I), 'simple'); eq(E.deflection('simple', w, L, Epa, I), 1.30208e-4, 'simple num', 1e-8);
eq(E.deflection('fixed', w, L, Epa, I), w * Math.pow(L, 4) / (384 * Epa * I), 'fixed'); eq(E.deflection('cantilever', w, L, Epa, I), w * Math.pow(L, 4) / (8 * Epa * I), 'cant');
eq(E.deflection('simple', w, L, Epa, I) / E.deflection('fixed', w, L, Epa, I), 5, 'ratio simple/fixed'); eq(E.deflection('cantilever', w, L, Epa, I) / E.deflection('simple', w, L, Epa, I), 384 / 40, 'cant/simple');
// scaling laws: L^4, 1/E, 1/I, w
eq(E.deflection('simple', w, 2 * L, Epa, I) / E.deflection('simple', w, L, Epa, I), 16, 'L^4'); eq(E.deflection('simple', 2 * w, L, Epa, I) / E.deflection('simple', w, L, Epa, I), 2, 'w');
eq(E.deflection('simple', w, L, 2 * Epa, I) / E.deflection('simple', w, L, Epa, I), 0.5, 'E');
// inertia: doubling thickness => 8x
eq(E.inertia(0.25, 0.04) / E.inertia(0.25, 0.02), 8, 'I h^3'); eq(E.inertia(0.2, 0.018), 0.2 * Math.pow(0.018, 3) / 12, 'I');
// self weight: 18 mm MDF 25 cm deep = 750*0.25*0.018 = 3.375 kg/m
eq(E.selfMassPerM(0.25, 0.018, 750), 3.375, 'self');
// sag(): 80 cm, 25 cm deep, 18 mm MDF, hardbacks 25 kg/m
var r = E.sag({ material: 'mdf', support: 'simple', load: 25, depth: 25, thick: 18, length: 80 });
eq(r.totalKgPerM, 28.375, 'total'); eq(r.w, 28.375 * 9.81, 'w'); eq(r.shelfKg, 28.375 * 0.8, 'shelf kg');
var ref = 5 * 28.375 * 9.81 * Math.pow(0.8, 4) / (384 * 3.5e9 * E.inertia(0.25, 0.018)); eq(r.sagMm, ref * 1000, 'sag mm', 1e-9);
eq(r.sagMm, 3.49, 'sag approx', 0.01); eq(r.ratio, 800 / r.sagMm, 'ratio'); eq(r.longTermMm, 2 * r.sagMm, 'creep');
eq(E.verdict(r.ratio), 'sag', 'verdict sag'); // about L/229
eq(E.verdict(300), 'ok', 'v300'); eq(E.verdict(299), 'sag', 'v299'); eq(E.verdict(150), 'sag', 'v150'); eq(E.verdict(149), 'bad', 'v149');
// solid pine same shelf is much stiffer than MDF
eq(E.sag({ material: 'pine', support: 'simple', load: 25, depth: 25, thick: 18, length: 80 }).sagMm < r.sagMm ? 1 : 0, 1, 'pine stiffer');
// maxLength: at that length ratio is exactly the limit; slightly longer fails
var o = { material: 'plywood', support: 'simple', load: 25, depth: 25, thick: 18 };
var ml = E.maxLength(o); eq(E.sag({ material: 'plywood', support: 'simple', load: 25, depth: 25, thick: 18, length: ml }).ratio, 300, 'max length hits limit', 1e-6);
eq(E.sag({ material: 'plywood', support: 'simple', load: 25, depth: 25, thick: 18, length: ml * 1.05 }).ratio < 300 ? 1 : 0, 1, 'longer fails');
// minThickness hits limit
var mt = E.minThickness({ material: 'mdf', support: 'simple', load: 25, depth: 25, length: 80 });
eq(E.sag({ material: 'mdf', support: 'simple', load: 25, depth: 25, thick: mt, length: 80 }).ratio, 300, 'min thick hits limit', 1e-5);
eq(mt > 18 ? 1 : 0, 1, 'needs more than 18 mm');
// glass tabletop sanity: 10 mm glass 60 cm deep, 80 cm span, no load: tiny sag
eq(E.sag({ material: 'glass', support: 'simple', load: 0, depth: 30, thick: 10, length: 80 }).sagMm < 3 ? 1 : 0, 1, 'glass');
// empty light shelf is fine
eq(E.verdict(E.sag({ material: 'oak', support: 'simple', load: 0, depth: 20, thick: 25, length: 60 }).ratio), 'ok', 'oak empty ok');
// cantilever sag larger than simply supported for the same shelf
eq(E.sag({ material: 'pine', support: 'cantilever', load: 10, depth: 20, thick: 25, length: 40 }).sagMm > E.sag({ material: 'pine', support: 'simple', load: 10, depth: 20, thick: 25, length: 40 }).sagMm ? 1 : 0, 1, 'cant worse');
// monotone in load and length
for (var k = 0; k < 30; k++) { eq(E.sag({ material: 'pine', support: 'simple', load: k + 1, depth: 25, thick: 20, length: 70 }).sagMm > E.sag({ material: 'pine', support: 'simple', load: k, depth: 25, thick: 20, length: 70 }).sagMm ? 1 : 0, 1, 'mono load' + k); eq(E.sag({ material: 'pine', support: 'simple', load: 10, depth: 25, thick: 20, length: 50 + k + 1 }).sagMm > E.sag({ material: 'pine', support: 'simple', load: 10, depth: 25, thick: 20, length: 50 + k }).sagMm ? 1 : 0, 1, 'mono len' + k); }
Object.keys(E.MATERIALS).forEach(function (m) { eq(E.MATERIALS[m].E > 0 && E.MATERIALS[m].rho > 0 ? 1 : 0, 1, 'mat ' + m); });
console.log(n + ' assertions, ' + bad + ' failed'); process.exit(bad ? 1 : 0);
