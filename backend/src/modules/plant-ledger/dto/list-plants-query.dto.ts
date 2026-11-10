import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export const PLANT_LIST_STATUSES = ['active', 'planned', 'ended'] as const;
export type PlantListStatus = (typeof PLANT_LIST_STATUSES)[number];

/** Growing plants by default; `planned` is the want-to-grow list; `ended` lists past trees. */
export class ListPlantsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(PLANT_LIST_STATUSES)
  status: PlantListStatus = 'active';
}
