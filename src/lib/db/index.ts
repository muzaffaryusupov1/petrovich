import Dexie, { type Table } from 'dexie';
import type { Estimate } from '../../types';

class UstaSmetaDB extends Dexie {
  estimates!: Table<Estimate>;

  constructor() {
    super('UstaSmetaDB');
    this.version(1).stores({
      estimates: 'id, createdAt, updatedAt, jobTypeId',
    });
  }
}

export const db = new UstaSmetaDB();

// ---- CRUD helpers ----

export async function getAllEstimates(): Promise<Estimate[]> {
  return db.estimates.orderBy('updatedAt').reverse().toArray();
}

export async function getEstimate(id: string): Promise<Estimate | undefined> {
  return db.estimates.get(id);
}

export async function saveEstimate(estimate: Estimate): Promise<void> {
  // Strip computed fields before storing
  const { totalWallArea, totalCeilingArea, totalMaterialCost, totalLaborCost, grandTotal, ...toStore } = estimate;
  // Also strip computed fields from materialLines
  const cleaned: Estimate = {
    ...toStore,
    materialLines: toStore.materialLines.map(({ quantity, packages, totalCost, ...rest }) => rest),
  };
  await db.estimates.put(cleaned);
}

export async function deleteEstimate(id: string): Promise<void> {
  await db.estimates.delete(id);
}

export async function duplicateEstimate(id: string): Promise<string> {
  const original = await db.estimates.get(id);
  if (!original) throw new Error('Estimate not found');
  const newId = crypto.randomUUID();
  const now = Date.now();
  await db.estimates.put({
    ...original,
    id: newId,
    createdAt: now,
    updatedAt: now,
    clientName: original.clientName ? `${original.clientName} (nusxa)` : '',
  });
  return newId;
}
