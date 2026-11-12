import type { AuthedRequest } from '../../common/auth/authed-request';
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
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { EndPlantDto } from './dto/end-plant.dto';
import { ListPlantsQueryDto } from './dto/list-plants-query.dto';
import { PlantEndService } from './services/plant-end.service';
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
import { mapPage } from '../../common/pagination';
import { toPlantView } from './domain/plant-view';
import { toEntryView } from './domain/entry-view';

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
    private readonly ending: PlantEndService,
  ) {}

  @Post('plants')
  async createPlant(
    @Request() req: AuthedRequest,
    @Body() dto: CreatePlantDto,
  ) {
    return toPlantView(await this.plants.create(req.user.id, dto));
  }

  @Get('plants')
  async getPlants(
    @Request() req: AuthedRequest,
    @Query() q: ListPlantsQueryDto,
  ) {
    return mapPage(await this.plants.list(req.user.id, q), toPlantView);
  }

  @Post('plants/:id/end')
  async endPlant(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: EndPlantDto,
  ) {
    return toPlantView(await this.ending.end(req.user.id, id, dto));
  }

  @Post('plants/:id/restore')
  async restorePlant(@Request() req: AuthedRequest, @Param('id') id: string) {
    return toPlantView(await this.ending.restore(req.user.id, id));
  }

  @Get('plants/:id')
  async getPlantDetail(@Request() req: AuthedRequest, @Param('id') id: string) {
    return toPlantView(await this.plants.detailView(req.user, id));
  }

  @Get('plants/:id/seasonal-state')
  getSeasonalState(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.plants.getSeasonalState(req.user.id, id);
  }

  @Put('plants/:id')
  async updatePlant(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlantDto,
  ) {
    return toPlantView(await this.plants.update(req.user.id, id, dto));
  }

  @Post('plants/:id/journal')
  async addLog(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: AddLogDto,
  ) {
    await this.plants.assertGrowing(req.user.id, id);
    const entry = await this.journal.addEntry(req.user.id, id, {
      type: dto.type,
      content: dto.content,
      metadata: dto.metadata as object | undefined,
      eventAt: dto.event_at ? new Date(dto.event_at) : undefined,
    });
    return toEntryView(entry);
  }

  @Get('plants/:id/timeline')
  async getTimeline(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Query() q: TimelineQueryDto,
  ) {
    await this.plants.getDetail(req.user.id, id);
    return mapPage(
      await this.journal.timeline(req.user.id, id, q),
      toEntryView,
    );
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
    await this.plants.assertGrowing(req.user.id, id);
    return this.tasks.updateStatus(
      req.user.id,
      id,
      taskId,
      dto.status,
      this.clock.now(),
    );
  }
}
