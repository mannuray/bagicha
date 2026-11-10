import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Put,
} from '@nestjs/common';
import { PlantLedgerService } from './plant-ledger.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { AddLogDto } from './dto/add-log.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('ledger')
@UseGuards(AuthGuard('jwt'))
export class PlantLedgerController {
  constructor(private readonly plantLedgerService: PlantLedgerService) {}

  @Post('plants')
  async createPlant(@Request() req, @Body() createPlantDto: CreatePlantDto) {
    return this.plantLedgerService.createPlant(req.user.id, createPlantDto);
  }

  @Get('plants')
  async getPlants(@Request() req) {
    return this.plantLedgerService.getPlants(req.user.id);
  }

  @Get('plants/:id')
  async getPlantDetail(@Request() req, @Param('id') id: string) {
    return this.plantLedgerService.getPlantDetail(req.user.id, id);
  }

  @Get('plants/:id/seasonal-state')
  async getSeasonalState(@Request() req, @Param('id') id: string) {
    return this.plantLedgerService.getSeasonalState(req.user.id, id);
  }

  @Put('plants/:id')
  async updatePlant(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePlantDto: UpdatePlantDto,
  ) {
    return this.plantLedgerService.updatePlant(req.user.id, id, updatePlantDto);
  }

  @Post('plants/:id/journal')
  async addLog(
    @Request() req,
    @Param('id') id: string,
    @Body() addLogDto: AddLogDto,
  ) {
    return this.plantLedgerService.addLog(req.user.id, id, addLogDto);
  }

  @Get('plants/:id/timeline')
  async getTimeline(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
  ) {
    const result = await this.plantLedgerService.getTimeline(
      req.user.id,
      id,
      Number(page),
      Number(pageSize),
    );
    // Since our Success Interceptor handles the structure, we return the data + pagination.
    // However, the interceptor expects 'data', so we return it in a specific way that the interceptor can handle
    // for pagination cases if needed. For now, we return it as an object.
    return result;
  }

  @Get('plants/:id/cycles')
  async getCycles(@Request() req, @Param('id') id: string) {
    return this.plantLedgerService.getCycles(req.user.id, id);
  }

  @Get('plants/:id/tasks')
  async getTasks(@Request() req, @Param('id') id: string) {
    return this.plantLedgerService.getTasks(req.user.id, id);
  }

  @Get('tasks')
  async getUserTasks(@Request() req) {
    return this.plantLedgerService.getUserTasks(req.user.id);
  }

  @Get('plants/:id/mitigation-plan')
  async getMitigationPlan(@Request() req, @Param('id') id: string) {
    return this.plantLedgerService.getMitigationPlan(req.user.id, id);
  }

  @Put('plants/:id/tasks/:taskId')
  async updateTaskStatus(
    @Request() req,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return this.plantLedgerService.updateTaskStatus(
      req.user.id,
      id,
      taskId,
      updateTaskStatusDto.status,
    );
  }
}
