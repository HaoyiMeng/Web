/**
 * Quasi-one-dimensional inviscid ideal-gas nozzle model.
 * Reservoir p0=1, gamma=1.4; no viscosity, heat transfer, boundary-layer separation,
 * oblique shocks, external plume or transient flow.
 * For internal normal shock, total pressure loss is accounted for downstream.
 */
export const G = 1.4;
export const THROAT_X = 0.39;
export const INLET_AREA_RATIO = 2.35;
export const EXIT_AREA_RATIO = 2.65;
const A = (G - 1) / 2;
const K = G / (G - 1);

export function area(x) {
  if (x <= THROAT_X) return 1 + (INLET_AREA_RATIO - 1) * ((THROAT_X - x) / THROAT_X) ** 2;
  return 1 + (EXIT_AREA_RATIO - 1) * ((x - THROAT_X) / (1 - THROAT_X)) ** 2;
}
export function areaMach(M) {
  if (M <= 0) return Infinity;
  return ((2 / (G + 1)) * (1 + A * M * M)) ** ((G + 1) / (2 * (G - 1))) / M;
}
export function machFromArea(areaRatio, branch = 'sub') {
  if (areaRatio < 1 - 1e-9) throw new Error('A/A* must be >= 1');
  if (areaRatio <= 1 + 1e-10) return 1;
  let low = branch === 'sub' ? 1e-12 : 1;
  let high = branch === 'sub' ? 1 : 25;
  for (let i = 0; i < 95; i++) {
    const mid = (low + high) / 2;
    const f = areaMach(mid);
    if (branch === 'sub') {
      if (f > areaRatio) low = mid; else high = mid;
    } else {
      if (f > areaRatio) high = mid; else low = mid;
    }
  }
  return (low + high) / 2;
}
export const pressureRatio = M => (1 + A * M * M) ** (-K);
export const temperatureRatio = M => 1 / (1 + A * M * M);

function shockAt(x) {
  const r = area(x);
  const M1 = machFromArea(r, 'sup');
  const M2 = Math.sqrt((1 + A * M1 * M1) / (G * M1 * M1 - A));
  const p2p1 = 1 + 2 * G / (G + 1) * (M1 * M1 - 1);
  const p02p01 = p2p1 * pressureRatio(M1) / pressureRatio(M2);
  const downstreamStarArea = r / areaMach(M2);
  const Me = machFromArea(area(1) / downstreamStarArea, 'sub');
  const pb = p02p01 * pressureRatio(Me);
  return { x, M1, M2, p02p01, downstreamStarArea, Me, pb };
}

export const LIMITS = (() => {
  const MeSub = machFromArea(area(1), 'sub');
  const MeSup = machFromArea(area(1), 'sup');
  return {
    chokeBackPressure: pressureRatio(MeSub),
    shockAtExitBackPressure: shockAt(1).pb,
    designBackPressure: pressureRatio(MeSup),
  };
})();

/** solveNozzle returns physically modelled internal state at static back-pressure pb/p0. */
export function solveNozzle(backPressure, count = 151) {
  if (!Number.isFinite(backPressure) || backPressure <= 0 || backPressure > 1) {
    throw new Error('Back pressure ratio must be 0 < pb/p0 <= 1');
  }
  const pb = backPressure;
  let mode, shock = null, starArea = null, massFraction, exitM;
  if (pb > LIMITS.chokeBackPressure + 1e-9) {
    mode = 'subsonic';
    const Me = Math.sqrt(Math.max(0, pb ** (-(G - 1) / G) - 1) / A);
    starArea = area(1) / areaMach(Me);
    exitM = Me;
  } else if (pb > LIMITS.shockAtExitBackPressure + 1e-9) {
    mode = 'internal-shock';
    let lo = THROAT_X, hi = 1;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (shockAt(mid).pb > pb) lo = mid; else hi = mid;
    }
    shock = shockAt((lo + hi) / 2);
    exitM = shock.Me;
  } else {
    mode = 'supersonic-exit';
    exitM = machFromArea(area(1), 'sup');
  }
  let throatM = 1;
  if (mode === 'subsonic') {
    throatM = machFromArea(1 / starArea, 'sub');
    massFraction = 1 / areaMach(throatM);
  } else massFraction = 1;
  const evaluate = x => {
    const r = area(x);
    let M, p0Ratio = 1;
    if (mode === 'subsonic') M = machFromArea(r / starArea, 'sub');
    else if (x <= THROAT_X) M = machFromArea(r, 'sub');
    else if (shock && x > shock.x) {
      M = machFromArea(r / shock.downstreamStarArea, 'sub');
      p0Ratio = shock.p02p01;
    } else M = machFromArea(r, 'sup');
    return { x, areaRatio: r, mach: M, pressure: p0Ratio * pressureRatio(M), temperature: temperatureRatio(M), p0Ratio };
  };
  const points = Array.from({length: count}, (_, i) => evaluate(i / (count - 1)));
  if (shock) {
    const upstream = evaluate(shock.x);
    const downstream = {
      x: shock.x, areaRatio: area(shock.x), mach: shock.M2,
      pressure: shock.p02p01 * pressureRatio(shock.M2),
      temperature: temperatureRatio(shock.M2), p0Ratio: shock.p02p01,
    };
    points.push(upstream, downstream);
    points.sort((a,b) => a.x-b.x || (a === upstream ? -1 : b === upstream ? 1 : 0));
  }
  const exitPressure = mode === 'subsonic' ? pb : mode === 'internal-shock' ? shock.pb : pressureRatio(exitM);
  const external = mode === 'supersonic-exit' ? (pb > LIMITS.designBackPressure + 1e-4 ? 'overexpanded' : pb < LIMITS.designBackPressure - 1e-4 ? 'underexpanded' : 'design') : null;
  return { mode, pb, shock, points, exitM, exitPressure, throatM, massFraction, external, limits: LIMITS };
}
