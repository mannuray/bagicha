import { isApiError } from '../../lib/errors';

/** True for the backend's "not your plant / no such plant" answer. */
export const isPlantMissing = (err: unknown) => isApiError(err) && err.code === 'PLANT_NOT_FOUND';
