import { RequestLang, type Lang } from '../../common/http/lang';
import type { AuthedRequest } from '../../common/auth/authed-request';
import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Post,
} from '@nestjs/common';
import { SeasonalService } from './seasonal.service';
import { TreeIntelligenceService } from './services/tree-intelligence.service';
import { TreeTaskMaterializer } from './services/tree-task-materializer.service';
import { AuthGuard } from '@nestjs/passport';

const DEFAULT_DISTRICT = 'Patna';

@Controller('seasonal')
@UseGuards(AuthGuard('jwt'))
export class SeasonalController {
  constructor(
    private readonly seasonalService: SeasonalService,
    private readonly intelligence: TreeIntelligenceService,
    private readonly materializer: TreeTaskMaterializer,
  ) {}

  @Get('guide')
  getGuide(@Request() req: AuthedRequest, @RequestLang() lang: Lang) {
    return this.seasonalService.getSeasonalGuide(
      { ...req.user, district: req.user.district || DEFAULT_DISTRICT },
      lang,
    );
  }

  @Get('plants/:id/intelligence')
  async getTreeIntelligence(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @RequestLang() lang: Lang,
  ) {
    return this.intelligence.getTreeIntelligence(req.user.id, id, lang);
  }

  @Post('plants/:id/materialize-tasks')
  async materializeTasks(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
  ) {
    return this.materializer.materializeTasksForTree(req.user.id, id);
  }
}
