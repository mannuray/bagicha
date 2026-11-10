import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaginationQueryDto } from '../../common/pagination';
import { Clock } from '../../common/time';
import { AddLogDto } from './dto/add-log.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CycleService } from './services/cycle.service';
import { JournalService } from './services/journal.service';
import { MitigationService } from './services/mitigation.service';
import { PlantRecordService } from './services/plant-record.service';
import { TaskService } from './services/task.service';

type AuthedRequest = { user: { id: string } };

@Controller('ledger')
@UseGuards(AuthGuard('jwt'))
export class PlantLedgerController {
  constructor(
    private readonly plants: PlantRecordService,
    private readonly journal: JournalService,
    private readonly cycles: CycleService,
    private readonly tasks: TaskService,
    private readonly mitigation: MitigationService,
    private readonly clock: Clock,
  ) {}

  @Post('plants')
  createPlant(@Request() req: AuthedRequest, @Body() dto: CreatePlantDto) {
    return this.plants.create(req.user.id, dto);
  }

  @Get('plants')
  getPlants(@Request() req: AuthedRequest, @Query() q: PaginationQueryDto) {
    return this.plants.list(req.user.id, q);
  }

  @Get('plants/:id')
  getPlantDetail(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.plants.getDetail(req.user.id, id);
  }

  @Get('plants/:id/seasonal-state')
  getSeasonalState(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.plants.getSeasonalState(req.user.id, id);
  }

  @Put('plants/:id')
  updatePlant(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlantDto,
  ) {
    return this.plants.update(req.user.id, id, dto);
  }

  @Post('plants/:id/journal')
  async addLog(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: AddLogDto,
  ) {
    await this.plants.getDetail(req.user.id, id);
    return this.journal.addEntry(req.user.id, id, {
      type: dto.type,
      content: dto.content,
      metadata: dto.metadata as object | undefined,
      eventAt: dto.event_at ? new Date(dto.event_at) : undefined,
    });
  }

  @Get('plants/:id/timeline')
  async getTimeline(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Query() q: PaginationQueryDto,
  ) {
    await this.plants.getDetail(req.user.id, id);
    return this.journal.timeline(req.user.id, id, q);
  }

  @Get('plants/:id/cycles')
  async getCycles(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Query() q: PaginationQueryDto,
  ) {
    await this.plants.getDetail(req.user.id, id);
    return this.cycles.list(req.user.id, id, q);
  }

  @Get('plants/:id/tasks')
  async getTasks(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Query() q: PaginationQueryDto,
  ) {
    await this.plants.getDetail(req.user.id, id);
    return this.tasks.listForPlant(req.user.id, id, q);
  }

  @Get('tasks')
  getUserTasks(@Request() req: AuthedRequest, @Query() q: PaginationQueryDto) {
    return this.tasks.listForUser(req.user.id, q);
  }

  @Get('plants/:id/mitigation-plan')
  async getMitigationPlan(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
  ) {
    await this.plants.getDetail(req.user.id, id);
    return this.mitigation.plan(req.user.id, id);
  }

  @Put('plants/:id/tasks/:taskId')
  async updateTaskStatus(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    await this.plants.getDetail(req.user.id, id);
    return this.tasks.updateStatus(
      req.user.id,
      id,
      taskId,
      dto.status,
      this.clock.now(),
    );
  }
}
