import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export const TASK_LIST_STATUSES = ['open', 'closed'] as const;
export type TaskListStatus = (typeof TASK_LIST_STATUSES)[number];

/** `open`: pending tasks by due date; `closed`: done/skipped/cancelled, latest first; all when omitted. */
export class ListTasksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(TASK_LIST_STATUSES)
  status?: TaskListStatus;
}
