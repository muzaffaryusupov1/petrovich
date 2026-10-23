import { describe, it, expect } from 'vitest';
import {
  calcRoomWallArea,
  calcRoomCeilingArea,
  calcPackages,
  calcTotalWallArea,
  computeEstimate,
} from './index';
import type { Room, Estimate } from '../../types';

const baseRoom = (): Room => ({
  id: 'r1',
  name: 'Mehmonxona',
  length: 5,
  width: 4,
  height: 2.7,
  doors: 1,
  windows: 2,
  doorArea: 1.9,
  windowArea: 1.44,
  includeCeiling: false,
});

describe('calcRoomWallArea', () => {
  it('calculates wall area minus openings', () => {
    const room = baseRoom();
    // perimeter = 2*(5+4) = 18m
    // walls = 18 * 2.7 = 48.6 m²
    // openings = 1*1.9 + 2*1.44 = 4.78 m²
    // net = 48.6 - 4.78 = 43.82 m²
    expect(calcRoomWallArea(room)).toBeCloseTo(43.82, 1);
  });

  it('never returns negative area', () => {
    const room = { ...baseRoom(), doors: 100, windows: 100 };
    expect(calcRoomWallArea(room)).toBe(0);
  });

  it('zero openings', () => {
    const room = { ...baseRoom(), doors: 0, windows: 0 };
    expect(calcRoomWallArea(room)).toBeCloseTo(48.6, 1);
  });
});

describe('calcRoomCeilingArea', () => {
  it('returns length × width', () => {
    expect(calcRoomCeilingArea(baseRoom())).toBeCloseTo(20, 1);
  });
});

describe('calcPackages', () => {
  it('rounds up to whole packages', () => {
    // area=10, consumption=1.2 kg/m2 → 12kg, packageSize=25 → ceil(12/25)=1
    expect(calcPackages(10, 1.2, 25)).toBe(1);
  });

  it('needs 2 packages when exceeds one', () => {
    // area=30, consumption=1.2 → 36kg, packageSize=25 → ceil(36/25)=2
    expect(calcPackages(30, 1.2, 25)).toBe(2);
  });

  it('exact multiple stays at exact count', () => {
    // area=25, consumption=1.0 → 25kg, packageSize=25 → ceil(25/25)=1
    expect(calcPackages(25, 1.0, 25)).toBe(1);
  });
});

describe('calcTotalWallArea', () => {
  it('sums multiple rooms', () => {
    const rooms = [baseRoom(), { ...baseRoom(), id: 'r2', length: 3, width: 3 }];
    const r1Area = calcRoomWallArea(rooms[0]);
    const r2Area = calcRoomWallArea(rooms[1]);
    expect(calcTotalWallArea(rooms)).toBeCloseTo(r1Area + r2Area, 1);
  });
});

describe('computeEstimate', () => {
  it('computes grand total correctly', () => {
    const estimate: Estimate = {
      id: 'e1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      clientName: 'Test',
      address: '',
      jobTypeId: 'putty_and_paint_walls',
      rooms: [baseRoom()],
      materialLines: [
        {
          materialId: 'putty_start',
          name: { uz: 'Test', ru: 'Test' },
          consumptionPerUnit: 1.2,
          packageSize: 25,
          packageUnit: 'kg',
          pricePerPackage: 85000,
        },
      ],
      laborPricePerM2: 25000,
    };

    const result = computeEstimate(estimate);
    expect(result.totalWallArea).toBeCloseTo(43.82, 1);
    expect(result.grandTotal).toBeGreaterThan(0);
    // labor = 43.82 * 25000 = 1 095 500
    expect(result.totalLaborCost).toBeCloseTo(43.82 * 25000, 0);
  });
});
