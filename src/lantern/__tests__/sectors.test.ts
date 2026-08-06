import type { LanternScene, LightSector } from '@/content/types';

import { isAngleInSector, normalizeDeg, visibleLights } from '../sectors';

// A standard power-driven vessel underway (<50m), Rule 21/23: masthead
// white 225° forward arc, sidelights 112.5° each, sternlight white 135°
// astern arc. These four sectors are the load-bearing case — every other
// vessel configuration in this app's content is a variation on them.
const MASTHEAD: LightSector = { lightId: 'masthead', startDeg: -112.5, endDeg: 112.5 };
const SIDE_STBD: LightSector = { lightId: 'sidelight-stbd', startDeg: 0, endDeg: 112.5 };
const SIDE_PORT: LightSector = { lightId: 'sidelight-port', startDeg: -112.5, endDeg: 0 };
const STERN: LightSector = { lightId: 'sternlight', startDeg: 112.5, endDeg: 247.5 };

describe('normalizeDeg', () => {
  it('wraps into [0, 360)', () => {
    expect(normalizeDeg(0)).toBe(0);
    expect(normalizeDeg(360)).toBe(0);
    expect(normalizeDeg(-90)).toBe(270);
    expect(normalizeDeg(450)).toBe(90);
    expect(normalizeDeg(-360)).toBe(0);
  });
});

describe('isAngleInSector', () => {
  it('masthead (225° forward arc) is visible dead ahead, not dead astern', () => {
    expect(isAngleInSector(0, MASTHEAD)).toBe(true);
    expect(isAngleInSector(180, MASTHEAD)).toBe(false);
  });

  it('masthead is visible exactly to its 112.5° boundary on both sides, not past it', () => {
    expect(isAngleInSector(112.5, MASTHEAD)).toBe(true);
    expect(isAngleInSector(-112.5, MASTHEAD)).toBe(true);
    expect(isAngleInSector(113, MASTHEAD)).toBe(false);
    expect(isAngleInSector(-113, MASTHEAD)).toBe(false);
  });

  it('starboard sidelight (green) only shows on the starboard side', () => {
    expect(isAngleInSector(50, SIDE_STBD)).toBe(true);
    expect(isAngleInSector(0, SIDE_STBD)).toBe(true);
    expect(isAngleInSector(112.5, SIDE_STBD)).toBe(true);
    expect(isAngleInSector(-50, SIDE_STBD)).toBe(false);
    expect(isAngleInSector(180, SIDE_STBD)).toBe(false);
  });

  it('port sidelight (red) only shows on the port side, handling the negative range', () => {
    expect(isAngleInSector(-50, SIDE_PORT)).toBe(true);
    expect(isAngleInSector(0, SIDE_PORT)).toBe(true);
    expect(isAngleInSector(-112.5, SIDE_PORT)).toBe(true);
    expect(isAngleInSector(50, SIDE_PORT)).toBe(false);
  });

  it('a query angle authored as 0–360 matches a sector authored as negative, and vice versa', () => {
    // -50° and 310° are the same physical bearing.
    expect(isAngleInSector(310, SIDE_PORT)).toBe(true);
  });

  it('sternlight only shows astern, not from the beam forward', () => {
    expect(isAngleInSector(180, STERN)).toBe(true);
    expect(isAngleInSector(112.5, STERN)).toBe(true);
    expect(isAngleInSector(247.5, STERN)).toBe(true);
    expect(isAngleInSector(100, STERN)).toBe(false);
    expect(isAngleInSector(0, STERN)).toBe(false);
  });

  it('at dead ahead (0°), both sidelights and the masthead are visible together — the classic head-on picture', () => {
    expect(isAngleInSector(0, MASTHEAD)).toBe(true);
    expect(isAngleInSector(0, SIDE_STBD)).toBe(true);
    expect(isAngleInSector(0, SIDE_PORT)).toBe(true);
    expect(isAngleInSector(0, STERN)).toBe(false);
  });

  it('at dead astern (180°), only the sternlight is visible — no sidelights, no masthead', () => {
    expect(isAngleInSector(180, MASTHEAD)).toBe(false);
    expect(isAngleInSector(180, SIDE_STBD)).toBe(false);
    expect(isAngleInSector(180, SIDE_PORT)).toBe(false);
    expect(isAngleInSector(180, STERN)).toBe(true);
  });

  it('an all-round light (0–360) is visible at every angle', () => {
    const allRound: LightSector = { lightId: 'anchor', startDeg: 0, endDeg: 360 };
    for (const a of [0, 45, 90, 135, 180, 225, 270, 315, -50, 400]) {
      expect(isAngleInSector(a, allRound)).toBe(true);
    }
  });

  it('handles a query angle far outside 0–360 the same as its normalized form', () => {
    expect(isAngleInSector(720, MASTHEAD)).toBe(isAngleInSector(0, MASTHEAD));
    expect(isAngleInSector(-1000, STERN)).toBe(isAngleInSector(normalizeDeg(-1000), STERN));
  });
});

describe('visibleLights', () => {
  const scene: LanternScene = {
    lights: [
      { id: 'masthead', color: 'white', x: 50, y: 16 },
      { id: 'sidelight-port', color: 'red', x: 40, y: 30 },
      { id: 'sidelight-stbd', color: 'green', x: 60, y: 30 },
      { id: 'sternlight', color: 'white', x: 50, y: 38 },
    ],
    lightSectors: [MASTHEAD, SIDE_STBD, SIDE_PORT, STERN],
  };

  it('shows masthead + both sidelights dead ahead', () => {
    const ids = visibleLights(scene, 0).map((l) => l.id);
    expect(ids.sort()).toEqual(['masthead', 'sidelight-port', 'sidelight-stbd']);
  });

  it('shows only the sternlight dead astern', () => {
    const ids = visibleLights(scene, 180).map((l) => l.id);
    expect(ids).toEqual(['sternlight']);
  });

  it('shows masthead + green sidelight only, viewed from forward of the starboard beam', () => {
    const ids = visibleLights(scene, 60).map((l) => l.id);
    expect(ids.sort()).toEqual(['masthead', 'sidelight-stbd']);
  });

  it('omits lights that have an id but no matching sector', () => {
    const partialScene: LanternScene = {
      lights: [...scene.lights, { id: 'no-sector', color: 'yellow', x: 50, y: 10 }],
      lightSectors: scene.lightSectors,
    };
    expect(visibleLights(partialScene, 0).some((l) => l.id === 'no-sector')).toBe(false);
  });

  it('omits lights with no id even if a stray sector referenced them', () => {
    const noIdScene: LanternScene = {
      lights: [{ color: 'white', x: 50, y: 20 }],
      lightSectors: [{ lightId: 'ghost', startDeg: 0, endDeg: 360 }],
    };
    expect(visibleLights(noIdScene, 0)).toEqual([]);
  });

  it('returns an empty array for a scene with no lightSectors', () => {
    expect(visibleLights({ lights: scene.lights }, 0)).toEqual([]);
  });
});
