// ============================================================
// PURE CALCULATION FUNCTIONS — unit-tested, no side-effects
// ============================================================
import type { Room, MaterialLine, Estimate, MaterialDef, JobTypeDef } from '../../types';

// Default door/window area constants (can be overridden per room)
export const DEFAULT_DOOR_AREA = 1.9;   // m² (PLACEHOLDER — verify with master)
export const DEFAULT_WINDOW_AREA = 1.44; // m² (PLACEHOLDER — verify with master)

/**
 * Calculate wall area for a single room.
 * Formula: perimeter × height − (doors × doorArea) − (windows × windowArea)
 */
export function calcRoomWallArea(room: Room): number {
  const perimeter = 2 * (room.length + room.width);
  const wallArea = perimeter * room.height;
  const openingsArea = room.doors * room.doorArea + room.windows * room.windowArea;
  return Math.max(0, wallArea - openingsArea);
}

/**
 * Calculate ceiling area for a single room.
 */
export function calcRoomCeilingArea(room: Room): number {
  return room.length * room.width;
}

/**
 * Total wall area across all rooms.
 */
export function calcTotalWallArea(rooms: Room[]): number {
  return rooms.reduce((sum, r) => sum + calcRoomWallArea(r), 0);
}

/**
 * Total ceiling area for rooms where includeCeiling = true.
 */
export function calcTotalCeilingArea(rooms: Room[]): number {
  return rooms
    .filter((r) => r.includeCeiling)
    .reduce((sum, r) => sum + calcRoomCeilingArea(r), 0);
}

/**
 * Calculate how many whole packages needed.
 * Rounds up to nearest whole package.
 */
export function calcPackages(
  totalArea: number,
  consumptionPerUnit: number,
  packageSize: number
): number {
  const totalUnits = totalArea * consumptionPerUnit;
  return Math.ceil(totalUnits / packageSize);
}

/**
 * Calculate total cost for a material line given area.
 */
export function calcMaterialLineCost(line: MaterialLine, totalArea: number): {
  quantity: number;
  packages: number;
  totalCost: number;
} {
  const quantity = totalArea * line.consumptionPerUnit;
  const packages = Math.ceil(quantity / line.packageSize);
  const totalCost = packages * line.pricePerPackage;
  return { quantity, packages, totalCost };
}

/**
 * Build initial MaterialLine[] from a JobTypeDef.
 * Prices are copied from defaultPrice so user can edit them later.
 */
export function buildMaterialLines(jobType: JobTypeDef): MaterialLine[] {
  return jobType.materials.map((mat: MaterialDef) => ({
    materialId: mat.id,
    name: mat.name,
    consumptionPerUnit: mat.consumptionPerUnit,
    packageSize: mat.packageSize,
    packageUnit: mat.packageUnit,
    pricePerPackage: mat.defaultPrice,
  }));
}

/**
 * Compute all derived fields on an Estimate.
 * Returns a new object — does not mutate.
 */
export function computeEstimate(estimate: Estimate): Estimate {
  const totalWallArea = calcTotalWallArea(estimate.rooms);
  const totalCeilingArea = calcTotalCeilingArea(estimate.rooms);
  const totalArea = totalWallArea + totalCeilingArea;

  const materialLines = estimate.materialLines.map((line) => {
    const { quantity, packages, totalCost } = calcMaterialLineCost(line, totalArea);
    return { ...line, quantity, packages, totalCost };
  });

  const totalMaterialCost = materialLines.reduce((s, l) => s + (l.totalCost ?? 0), 0);
  const totalLaborCost = totalArea * estimate.laborPricePerM2;
  const grandTotal = totalMaterialCost + totalLaborCost;

  return {
    ...estimate,
    materialLines,
    totalWallArea,
    totalCeilingArea,
    totalMaterialCost,
    totalLaborCost,
    grandTotal,
  };
}

/**
 * Format a number as UZS currency string.
 * Example: 1234567 → "1 234 567 so'm"
 */
export function formatUZS(amount: number, suffix = " so'm"): string {
  return (
    Math.round(amount)
      .toLocaleString('ru-RU') // uses space as thousands separator
      + suffix
  );
}

/**
 * Parse user input that may use comma or dot as decimal separator.
 */
export function parseDecimal(value: string): number {
  return parseFloat(value.replace(',', '.'));
}
