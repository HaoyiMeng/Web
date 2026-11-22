/**
 * Quasi-one-dimensional, steady, adiabatic, inviscid ideal-gas nozzle.
 * The boundary condition is reservoir stagnation state (p0,T0) and ambient pb.
 * An internal normal shock includes the downstream stagnation-pressure loss.
 * External jets, boundary layers, wall friction, heat transfer and start-up
 * transients are intentionally outside this model.
 */
export const G = 1.4;
export const THROAT_X = 0.39;
export const INLET_AREA_RATIO = 2.35;
export const EXIT_AREA_RATIO = 2.65;
export const DEFAULTS = Object.freeze({
  gamma: G, throatX: THROAT_X, inletAreaRatio: INLET_AREA_RATIO,
  exitAreaRatio: EXIT_AREA_RATIO, totalPressureKPa: 150,
  totalTemperatureK: 300, throatAreaCm2: 1.5, lengthM: 0.6,
  gasConstant: 287.05,
});

export function normalizeConfig(values = {}) {
  const c = { ...DEFAULTS, ...values };
  const limits = {
    gamma: [1.05, 1.8], throatX: [0.15, 0.85],
    inletAreaRatio: [1.05, 12], exitAreaRatio: [1.01, 12],
    totalPressureKPa: [1, 1e5], totalTemperatureK: [1, 1e5],
    throatAreaCm2: [0.0001, 1e5], lengthM: [0.001, 1e4],
    gasConstant: [1, 1e5],
  };
  for (const [key, [lo, hi]] of Object.entries(limits)) {
    if (!Number.isFinite(c[key]) || c[key] < lo || c[key] > hi) {
      throw new RangeError(key + ' must be in [' + lo + ', ' + hi + ']');
    }
  }
  return c;
}

export function area(x, config = DEFAULTS) {
  const {throatX:t, inletAreaRatio:ai, exitAreaRatio:ae} = config;
  const u = Math.max(0, Math.min(1, x));
  if (u <= t) return 1 + (ai - 1) * ((t - u) / t) ** 2;
  return 1 + (ae - 1) * ((u - t) / (1 - t)) ** 2;
}

export function areaMach(M, gamma = G) {
  if (M <= 0) return Infinity;
  const a = (gamma - 1) / 2;
  return Math.pow((2 / (gamma + 1)) * (1 + a * M * M),
    (gamma + 1) / (2 * (gamma - 1))) / M;
}

export function machFromArea(ratio, branch = 'sub', gamma = G) {
  if (ratio < 1 - 1e-9) throw new RangeError('A/A* must be >= 1');
  if (ratio <= 1 + 1e-10) return 1;
  let low = branch === 'sub' ? 0 : 1;
  let high = branch === 'sub' ? 1 : 60;
  for (let i = 0; i < 90; i++) {
    const mid = (low + high) / 2;
    const f = areaMach(mid, gamma);
    if (branch === 'sub') {
      if (f > ratio) low = mid; else high = mid;
    } else {
      if (f > ratio) high = mid; else low = mid;
    }
  }
  return (low + high) / 2;
}

export const pressureRatio = (M, gamma = G) =>
  Math.pow(1 + (gamma - 1) * M * M / 2, -gamma / (gamma - 1));
export const temperatureRatio = (M, gamma = G) =>
  1 / (1 + (gamma - 1) * M * M / 2);

function shockAt(x, c) {
  const g = c.gamma, r = area(x, c);
  const M1 = machFromArea(r, 'sup', g);
  const M2 = Math.sqrt((1 + (g - 1) * M1 * M1 / 2) /
    (g * M1 * M1 - (g - 1) / 2));
  const p2p1 = 1 + 2 * g * (M1 * M1 - 1) / (g + 1);
  const p02p01 = p2p1 * pressureRatio(M1, g) / pressureRatio(M2, g);
  const downstreamStarArea = r / areaMach(M2, g);
  const Me = machFromArea(c.exitAreaRatio / downstreamStarArea, 'sub', g);
  return {x, M1, M2, p2p1, p02p01, downstreamStarArea, Me,
    pb: p02p01 * pressureRatio(Me, g)};
}

export function getLimits(values = DEFAULTS) {
  const c = normalizeConfig(values);
  return {
    chokeBackPressure: pressureRatio(
      machFromArea(c.exitAreaRatio, 'sub', c.gamma), c.gamma),
    shockAtExitBackPressure: shockAt(1, c).pb,
    designBackPressure: pressureRatio(
      machFromArea(c.exitAreaRatio, 'sup', c.gamma), c.gamma),
  };
}
export const LIMITS = getLimits(DEFAULTS);

/**
 * @param {number} backPressure pb/p0 in (0,1]
 * @param {number} count number of axial samples
 * @param {object} configuration stagnation state, geometry and gas properties
 */
export function solveNozzle(backPressure, count = 181, configuration = {}) {
  if (!(backPressure > 0 && backPressure <= 1) || !Number.isFinite(backPressure)) {
    throw new RangeError('Back pressure ratio must satisfy 0 < pb/p0 <= 1');
  }
  const c = normalizeConfig(configuration), g = c.gamma, pb = backPressure;
  const limits = getLimits(c);
  let mode, shock = null, starArea = null, exitM;
  if (pb > limits.chokeBackPressure + 1e-9) {
    mode = 'subsonic';
    exitM = Math.sqrt(Math.max(0, Math.pow(pb, -(g - 1) / g) - 1) * 2 / (g - 1));
    starArea = exitM === 0 ? 0 : c.exitAreaRatio / areaMach(exitM, g);
  } else if (pb > limits.shockAtExitBackPressure + 1e-9) {
    mode = 'internal-shock';
    let lo = c.throatX, hi = 1;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (shockAt(mid, c).pb > pb) lo = mid; else hi = mid;
    }
    shock = shockAt((lo + hi) / 2, c);
    exitM = shock.Me;
  } else {
    mode = 'supersonic-exit';
    exitM = machFromArea(c.exitAreaRatio, 'sup', g);
  }
  const throatM = mode === 'subsonic'
    ? (starArea === 0 ? 0 : machFromArea(1 / starArea, 'sub', g)) : 1;
  const massFraction = mode === 'subsonic'
    ? (throatM === 0 ? 0 : 1 / areaMach(throatM, g)) : 1;
  const chokedMassFlowKgS = c.throatAreaCm2 * 1e-4 * c.totalPressureKPa * 1000 *
    Math.sqrt(g / (c.gasConstant * c.totalTemperatureK)) *
    Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1)));
  const massFlowKgS = chokedMassFlowKgS * massFraction;

  const evaluate = (x, side = 'upstream') => {
    const r = area(x, c);
    let M, p0Ratio = 1;
    if (mode === 'subsonic') {
      M = starArea === 0 ? 0 : machFromArea(r / starArea, 'sub', g);
    } else if (x <= c.throatX) {
      M = machFromArea(r, 'sub', g);
    } else if (shock && (x > shock.x || (x === shock.x && side === 'downstream'))) {
      M = machFromArea(r / shock.downstreamStarArea, 'sub', g);
      p0Ratio = shock.p02p01;
    } else M = machFromArea(r, 'sup', g);
    const tr = temperatureRatio(M, g);
    const pr = p0Ratio * pressureRatio(M, g);
    const temperatureK = c.totalTemperatureK * tr;
    const pressureKPa = c.totalPressureKPa * pr;
    const density = pressureKPa * 1000 / (c.gasConstant * temperatureK);
    const speedOfSound = Math.sqrt(g * c.gasConstant * temperatureK);
    return {x, distanceM:x*c.lengthM, areaRatio:r,
      areaCm2:r*c.throatAreaCm2, mach:M, pressure:pr, pressureKPa,
      temperature:tr, temperatureK, density, velocity:M*speedOfSound,
      speedOfSound, totalPressureRatio:p0Ratio,
      totalPressureKPa:p0Ratio*c.totalPressureKPa, massFlowKgS};
  };
  const samples = Math.max(31, Math.min(801, Math.floor(count)));
  const points = Array.from({length:samples}, (_, i) => evaluate(i/(samples-1)));
  if (shock) {
    const before = evaluate(shock.x), after = evaluate(shock.x, 'downstream');
    points.push(before, after);
    points.sort((a,b) => a.x-b.x || (a===before?-1:a===after?1:0));
  }
  const exitPressure = mode === 'subsonic' ? pb :
    mode === 'internal-shock' ? shock.pb : pressureRatio(exitM, g);
  const external = mode === 'supersonic-exit'
    ? (pb > limits.designBackPressure + 1e-5 ? 'overexpanded'
      : pb < limits.designBackPressure - 1e-5 ? 'underexpanded' : 'design') : null;
  return {mode, pb, config:c, shock, points, evaluate, exitM, exitPressure,
    throatM, massFraction, chokedMassFlowKgS, massFlowKgS, external, limits};
}
