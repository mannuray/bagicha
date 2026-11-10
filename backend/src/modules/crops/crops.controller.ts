import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import type { AuthedRequest } from '../../common/auth/authed-request';
import { CropsService } from './crops.service';
import { CreatePlaceDto, UpdatePlaceDto } from './dto/place.dto';
import { AddToPlanDto } from './dto/plan.dto';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class CropsController {
  constructor(private readonly crops: CropsService) {}

  @Get('crops/calendar')
  calendar(@Request() req: AuthedRequest) {
    return this.crops.calendar(req.user);
  }

  @Get('garden/places')
  places(@Request() req: AuthedRequest) {
    return this.crops.places(req.user.id);
  }

  @Post('garden/places')
  createPlace(@Request() req: AuthedRequest, @Body() dto: CreatePlaceDto) {
    return this.crops.createPlace(req.user.id, dto);
  }

  @Put('garden/places/:id')
  updatePlace(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto,
  ) {
    return this.crops.updatePlace(req.user.id, id, dto);
  }

  /** 201 when the crop is new on the list, 200 when it was already there. */
  @Post('crops/plan')
  async addToPlan(
    @Request() req: AuthedRequest,
    @Body() dto: AddToPlanDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { plant, created } = await this.crops.addToPlan(
      req.user.id,
      dto.crop_id,
    );
    res.status(created ? 201 : 200);
    return plant;
  }

  @Delete('crops/plan/:plantId')
  @HttpCode(204)
  async removeFromPlan(
    @Request() req: AuthedRequest,
    @Param('plantId') plantId: string,
  ) {
    await this.crops.removeFromPlan(req.user.id, plantId);
  }

  @Post('crops/plan/sync')
  sync(@Request() req: AuthedRequest) {
    return this.crops.sync(req.user);
  }
}
