import type { JobTypeDef } from '../../types';

import puttyAndPaintWalls from '../../data/jobTypes/putty_and_paint_walls.json';
import tilingWallsAndFloors from '../../data/jobTypes/tiling_walls_and_floors.json';
import drywallPartitionCeiling from '../../data/jobTypes/drywall_partition_ceiling.json';
import floorScreed from '../../data/jobTypes/floor_screed.json';

const JOB_TYPES: JobTypeDef[] = [
  puttyAndPaintWalls as unknown as JobTypeDef,
  tilingWallsAndFloors as unknown as JobTypeDef,
  drywallPartitionCeiling as unknown as JobTypeDef,
  floorScreed as unknown as JobTypeDef,
];

export function getAllJobTypes(): JobTypeDef[] {
  return JOB_TYPES;
}

export function getJobType(id: string): JobTypeDef | undefined {
  return JOB_TYPES.find((jt) => jt.id === id);
}
