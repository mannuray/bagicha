import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTreeDto } from './dto/create-tree.dto';
import { AddLogDto } from './dto/add-log.dto';
import { LifecycleService } from './services/lifecycle.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateTreeDto } from './dto/update-tree.dto';
import { SeasonalIntelligenceService } from './services/seasonal-intelligence.service';

@Injectable()
export class TreeLedgerService {
  constructor(
    private prisma: PrismaService,
    private lifecycleService: LifecycleService,
    private seasonalIntelligenceService: SeasonalIntelligenceService,
    @InjectQueue('task-generation') private taskQueue: Queue,
  ) {}

  async createTree(userId: string, createTreeDto: CreateTreeDto) {
    const plantingDate = createTreeDto.planting_date ? new Date(createTreeDto.planting_date) : null;
    const initialStage =
      createTreeDto.lifecycle_stage ??
      this.lifecycleService.calculateStage(plantingDate, createTreeDto.species);
    const manualStage = !!createTreeDto.lifecycle_stage;

    const tree = await this.prisma.tree.create({
      data: {
        ...createTreeDto,
        planting_date: plantingDate,
        user_id: userId,
        lifecycle_stage: initialStage,
        lifecycle_stage_manual: manualStage,
      },
    });

    // Trigger task generation background job
    await this.taskQueue.add('generate', {
      tree_id: tree.id,
      lifecycle_stage: tree.lifecycle_stage,
      species: tree.species,
    });

    return tree;
  }

  async getTrees(userId: string) {
    return this.prisma.tree.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getTreeDetail(userId: string, treeId: string) {
    const tree = await this.prisma.tree.findUnique({
      where: { id: treeId },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    });

    if (!tree) throw new NotFoundException('Tree not found');
    if (tree.user_id !== userId) throw new ForbiddenException('Access denied');

    if (!tree.lifecycle_stage_manual) {
      const currentStage = this.lifecycleService.calculateStage(tree.planting_date, tree.species);

      if (currentStage !== tree.lifecycle_stage) {
        await this.prisma.tree.update({
          where: { id: treeId },
          data: { lifecycle_stage: currentStage },
        });

        await this.taskQueue.add('generate', {
          tree_id: tree.id,
          lifecycle_stage: currentStage,
          species: tree.species,
        });

        tree.lifecycle_stage = currentStage;
      }
    }

    return tree;
  }

  async updateTree(userId: string, treeId: string, updateTreeDto: UpdateTreeDto) {
    const tree = await this.getTreeDetail(userId, treeId);

    const plantingDate =
      updateTreeDto.planting_date === null
        ? null
        : updateTreeDto.planting_date
          ? new Date(updateTreeDto.planting_date)
          : tree.planting_date;

    const species = updateTreeDto.species ?? tree.species;
    const lifecycleStage =
      updateTreeDto.lifecycle_stage ??
      this.lifecycleService.calculateStage(plantingDate, species);
    const manualStage = !!updateTreeDto.lifecycle_stage;

    const updatedTree = await this.prisma.tree.update({
      where: { id: treeId },
      data: {
        name: updateTreeDto.name ?? undefined,
        species: updateTreeDto.species ?? undefined,
        variety: updateTreeDto.variety ?? undefined,
        type: updateTreeDto.type ?? undefined,
        planting_date: plantingDate,
        lifecycle_stage: lifecycleStage,
        lifecycle_stage_manual: manualStage,
      },
    });

    await this.taskQueue.add('generate', {
      tree_id: updatedTree.id,
      lifecycle_stage: updatedTree.lifecycle_stage,
      species: updatedTree.species,
    });

    return updatedTree;
  }

  async addLog(userId: string, treeId: string, addLogDto: AddLogDto) {
    const tree = await this.getTreeDetail(userId, treeId);
    
    return this.prisma.log.create({
      data: {
        ...addLogDto,
        tree_id: tree.id,
      },
    });
  }

  async getTimeline(userId: string, treeId: string, page = 1, pageSize = 20) {
    const tree = await this.getTreeDetail(userId, treeId);

    const logs = await this.prisma.log.findMany({
      where: { tree_id: tree.id },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalItems = await this.prisma.log.count({
      where: { tree_id: tree.id },
    });

    return {
      items: logs,
      pagination: {
        page,
        page_size: pageSize,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / pageSize),
        has_next: page * pageSize < totalItems,
        has_previous: page > 1,
      },
    };
  }

  async getSeasonalState(userId: string, treeId: string) {
    const tree = await this.getTreeDetail(userId, treeId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        district: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.seasonalIntelligenceService.inferTreeSeasonalState(tree, user);
  }
}
