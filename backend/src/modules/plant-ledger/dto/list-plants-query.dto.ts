import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export const PLANT_LIST_STATUSES = ['active', 'planned', 'ended'] as const;
export type PlantListStatus = (typeof PLANT_LIST_STATUSES)[number];
export const PLANT_LIST_KINDS = ['tree', 'crop', 'flower'] as const;
export type PlantListKind = (typeof PLANT_LIST_KINDS)[number];

/** Growing plants by default; `planned` is the want-to-grow list; `ended` lists past trees. */
export class ListPlantsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(PLANT_LIST_STATUSES)
  status: PlantListStatus = 'active';

  /** Trees, calendar vegetables, or flowers (seasonal and perennial); all kinds when omitted. */
  @IsOptional()
  @IsIn(PLANT_LIST_KINDS)
  kind?: PlantListKind;
}
