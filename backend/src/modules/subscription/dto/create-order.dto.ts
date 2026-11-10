import { IsIn } from 'class-validator';
import { PLAN_IDS, type PlanId } from '../plans';

export class CreateOrderDto {
  @IsIn(PLAN_IDS)
  plan_id!: PlanId;
}
