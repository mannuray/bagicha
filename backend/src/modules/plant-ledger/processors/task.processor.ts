import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { TaskType, TaskStatus } from '@prisma/client';

@Processor('task-generation')
export class TaskProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { plant_id, lifecycle_stage, species } = job.data;
    
    console.log(`[PROCESSOR] Generating perennial tasks for ${species} in ${lifecycle_stage} stage (ID: ${plant_id})`);

    const tasks_to_create: any[] = [];
    const now = new Date();

    // Logic based on species and stage
    if (species.toLowerCase().includes('mango')) {
      tasks_to_create.push({
        plant_id,
        type: TaskType.FEED,
        due_date: new Date(now.setMonth(now.getMonth() + 6)), // Next deep feed
        status: TaskStatus.PENDING,
      });
      
      tasks_to_create.push({
        plant_id,
        type: TaskType.PRUNE,
        due_date: new Date(now.setMonth(now.getMonth() + 3)), // Pruning window
        status: TaskStatus.PENDING,
      });
    } else {
      // General default tasks
      tasks_to_create.push({
        plant_id,
        type: TaskType.WATER,
        due_date: new Date(now.setDate(now.getDate() + 3)),
        status: TaskStatus.PENDING,
      });
    }

    if (tasks_to_create.length > 0) {
      await this.prisma.task.createMany({
        data: tasks_to_create,
      });
    }

    return { created_count: tasks_to_create.length };
  }
}
