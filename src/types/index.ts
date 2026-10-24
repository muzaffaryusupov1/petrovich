// ============================================================
// TYPES — all domain types in one place
// ============================================================

export interface LocalizedString {
  uz: string;
  ru: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  title?: string;
}

export interface MaterialDef {
  id: string;
  name: LocalizedString;
  consumptionPerUnit: number; // e.g. kg per m²
  consumptionNote: string;
  packageSize: number;
  packageUnit: string;
  defaultPrice: number; // UZS per package
}

export interface JobTypeDef {
  id: string;
  name: LocalizedString;
  icon?: string;
  description?: LocalizedString;
  unit: string; // 'm2'
  materials: MaterialDef[];
  defaultLaborPricePerUnit: number; // UZS per m²
  laborNote: string;
}

// ---- Room (stored in estimate) ----

export interface Room {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  doors: number;
  windows: number;
  doorArea: number;   // m² per door (editable)
  windowArea: number; // m² per window (editable)
  includeCeiling: boolean;
}

// ---- Material line in estimate (user-editable copy of MaterialDef) ----

export interface MaterialLine {
  materialId: string;
  name: LocalizedString;
  consumptionPerUnit: number;
  packageSize: number;
  packageUnit: string;
  pricePerPackage: number;
  // computed fields (not stored, recalculated on load)
  quantity?: number; // total units needed (before rounding)
  packages?: number; // ceil(quantity / packageSize)
  totalCost?: number;
}

// ---- Estimate ----

export interface Estimate {
  id: string;
  createdAt: number; // timestamp ms
  updatedAt: number;
  clientName: string;
  address: string;
  jobTypeId: string;
  rooms: Room[];
  materialLines: MaterialLine[];
  laborPricePerM2: number;
  // computed (not stored)
  totalWallArea?: number;
  totalCeilingArea?: number;
  totalMaterialCost?: number;
  totalLaborCost?: number;
  grandTotal?: number;
}
