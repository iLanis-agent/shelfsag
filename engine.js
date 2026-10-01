(function (root) {
  'use strict';
  var G = 9.81;
  // Typical bending stiffness (Young's modulus, GPa) and density (kg/m3); approximate, real boards vary a lot.
  var MATERIALS = {
    pine: { name: 'Solid pine', E: 9, rho: 500 },
    oak: { name: 'Solid oak', E: 12, rho: 700 },
    plywood: { name: 'Plywood', E: 7, rho: 600 },
    mdf: { name: 'MDF', E: 3.5, rho: 750 },
    chipboard: { name: 'Chipboard / particleboard', E: 2.5, rho: 650 },
    glass: { name: 'Glass (float)', E: 70, rho: 2500 }
  };
  var LOADS = { empty: 0, paperbacks: 12, hardbacks: 25, heavy: 40 }; // kg per metre of shelf, approximate
  var SUPPORTS = {
    simple: { name: 'Resting on two pegs or brackets (simply supported)', k: 5 / 384 },
    fixed: { name: 'Both ends rigidly fixed (glued into slots)', k: 1 / 384 },
    cantilever: { name: 'Cantilever (held at one end only)', k: 1 / 8 }
  };
  var LIMIT_RATIO = 300; // sag limit L/300, common rule of thumb
  var CREEP = 2; // long-term deflection multiplier for wood and boards, rule of thumb
  function inertia(depthM, thickM) { return depthM * Math.pow(thickM, 3) / 12; }
  function selfMassPerM(depthM, thickM, rho) { return rho * depthM * thickM; }
  // uniform load w (N/m) over length L (m); returns mid-span (tip for cantilever) deflection in m
  function deflection(type, w, L, Epa, I) { return SUPPORTS[type].k * w * Math.pow(L, 4) / (Epa * I); }
  function sag(o) {
    var m = MATERIALS[o.material], d = o.depth / 100, h = o.thick / 1000, L = o.length / 100;
    var mass = o.load + selfMassPerM(d, h, m.rho);
    var w = mass * G;
    var dm = deflection(o.support, w, L, m.E * 1e9, inertia(d, h));
    return { sagMm: dm * 1000, ratio: dm > 0 ? L / dm : Infinity, w: w, selfKgPerM: selfMassPerM(d, h, m.rho), totalKgPerM: mass,
      longTermMm: dm * 1000 * CREEP, shelfKg: mass * L };
  }
  function bisect(f, lo, hi) { for (var i = 0; i < 80; i++) { var mid = (lo + hi) / 2; if (f(mid)) lo = mid; else hi = mid; } return lo; }
  // longest shelf (cm) that keeps sag at L/limit
  function maxLength(o, limit) {
    limit = limit || LIMIT_RATIO;
    return bisect(function (len) { var r = sag({ material: o.material, support: o.support, load: o.load, depth: o.depth, thick: o.thick, length: len }); return r.ratio >= limit; }, 1, 2000);
  }
  // thinnest board (mm) that keeps sag at L/limit for this length
  function minThickness(o, limit) {
    limit = limit || LIMIT_RATIO;
    var h = bisect(function (t) { var r = sag({ material: o.material, support: o.support, load: o.load, depth: o.depth, thick: t, length: o.length }); return r.ratio < limit; }, 0.1, 300);
    return h;
  }
  function verdict(ratio) { return ratio >= LIMIT_RATIO ? 'ok' : ratio >= 150 ? 'sag' : 'bad'; }
  var api = { G: G, MATERIALS: MATERIALS, LOADS: LOADS, SUPPORTS: SUPPORTS, LIMIT_RATIO: LIMIT_RATIO, CREEP: CREEP, inertia: inertia, selfMassPerM: selfMassPerM,
    deflection: deflection, sag: sag, maxLength: maxLength, minThickness: minThickness, verdict: verdict };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ShelfSag = api;
})(typeof window !== 'undefined' ? window : this);
