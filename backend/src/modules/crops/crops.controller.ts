import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthedRequest } from '../../common/auth/authed-request';
import { CropsService } from './crops.service';
import { CreatePlaceDto, UpdatePlaceDto } from './dto/place.dto';

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
}
