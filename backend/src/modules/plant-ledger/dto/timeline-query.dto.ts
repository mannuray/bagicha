import { LogType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

/** Timeline paging plus an optional `types=HARVEST,NOTE` filter. */
export class TimelineQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    String(value)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
  )
  @IsEnum(LogType, { each: true })
  types?: LogType[];
}
