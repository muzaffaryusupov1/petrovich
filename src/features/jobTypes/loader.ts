import type { JobTypeDef } from '../../types';

// Import all job type JSON files here.
// Add new job types by importing the JSON and adding to the array.
import puttyAndPaintWalls from '../../data/jobTypes/putty_and_paint_walls.json';

const JOB_TYPES: JobTypeDef[] = [puttyAndPaintWalls as JobTypeDef];

export function getAllJobTypes(): JobTypeDef[] {
  return JOB_TYPES;
}

export function getJobType(id: string): JobTypeDef | undefined {
  return JOB_TYPES.find((jt) => jt.id === id);
}
