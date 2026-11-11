import { IsNumber } from 'class-validator';

/** A point to look up. Sent in the body so it never lands in a URL (logs, monitoring, traces). */
export class LocateDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}
