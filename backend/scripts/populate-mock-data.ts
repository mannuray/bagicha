import { PrismaClient, RecordKind, TreeType, LifecycleStage, GrowthHabit, RecordPattern, LogType, TaskType, TaskPriority, TaskStatus, TaskSource, TaskCategory, RegionCluster, SeasonWindow, DropLevel, YieldQuality } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to populate mock data for Malda...');

  // 1. Find or Create User
  const user = await prisma.user.upsert({
    where: { phone_number: '+916202042225' },
    update: {},
    create: {
      phone_number: '+916202042225',
      name: 'Arjun Sharma',
      district: 'Patna',
      garden_types: ['trees', 'veggies'],
      language_pref: 'en',
      ranking_points: 950,
      badge_level: 'Master Orchardist',
    },
  });

  console.log(`👤 User: ${user.name} (+916202042225)`);

  // 2. Create "Digha Malda" Plant
  const plant = await prisma.plant.create({
    data: {
      user_id: user.id,
      name: 'Digha Malda Heritage',
      species_family: 'Anacardiaceae',
      species: 'Mangifera indica',
      variety: 'Malda',
      record_kind: RecordKind.TREE,
      type: TreeType.FRUIT_BEARING,
      growth_habit: GrowthHabit.PERENNIAL,
      record_pattern: RecordPattern.LONG_LIVED,
      lifecycle_stage: LifecycleStage.MATURE_BEARING,
      health_status: 'Thriving',
      planting_date: new Date('2018-07-20'),
      planting_date_input: '2018-07-20',
    },
  });

  console.log(`🌳 Plant created: ${plant.name} (Malda)`);

  // 3. Create a Plant Cycle for 2025 (Current/Recent)
  const cycle2025 = await prisma.plantCycle.create({
    data: {
      plant_id: plant.id,
      cycle_year: 2025,
      region_cluster: RegionCluster.EAST_INDIA,
      season_window: SeasonWindow.SUMMER,
      observed_flowering_at: new Date('2025-02-10'),
      observed_fruit_set_at: new Date('2025-03-15'),
      yield_quality: YieldQuality.EXCELLENT,
      flower_drop_level: DropLevel.LOW,
      fruit_drop_level: DropLevel.NONE,
      stress_score: 0,
      pest_pressure_score: 1,
      treatment_count: 1,
      cycle_summary: 'Ideal spring transition. Flowering density is at a 5-year high.',
      recommended_next_cycle_actions: ['Monitor for Hopper activity in early March', 'Apply organic potash'],
    },
  });

  // 4. Create Historical Logs for the "Geological Timeline"
  const journal_entries = [
    {
      plant_id: plant.id,
      type: LogType.PLANTING,
      content: 'Started the sanctuary with this authentic Digha Malda graft.',
      timestamp: new Date('2018-07-20'),
    },
    {
      plant_id: plant.id,
      type: LogType.FLOWERING,
      content: 'First major flowering cycle. The scent is overwhelming in the sanctuary.',
      timestamp: new Date('2023-02-25'),
    },
    {
      plant_id: plant.id,
      type: LogType.FLOWERING,
      content: 'Spring 2025: Exceptional bloom. Panicles are large and healthy.',
      timestamp: new Date('2025-02-12'),
      plant_cycle_id: cycle2025.id,
    },
    {
      plant_id: plant.id,
      type: LogType.FRUIT_SET,
      content: 'Pea-sized fruits confirmed across the entire canopy.',
      timestamp: new Date('2025-03-18'),
      plant_cycle_id: cycle2025.id,
      metadata: { fruit_set_strength: 'HIGH' },
    },
    {
        plant_id: plant.id,
        type: LogType.PHOTO,
        content: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVH-U7sXysGDYsa6cual1c1DqJ8furKsz8F4R2g0No_WnTP7DOhTD5cJuk8zeDxk_d50PDZ-8sBi_g4ZpFV8EwRoF7FlW4Fe9DIyXa0O4QKxuvD3ylC55FYRkON-zat6w5J4cOhfjnEOWAaYm1pFy_dfykFOgt0lZ6eMMPVKsPFH7WYTr1MFCz_p8bP8cdiwkBevCvzuBr4E19GAtF_0mr1w-FLf8g3fbLKTGPQW2Gl-vYYdCa-agAGiq_c6DFqh_fU7HvsiE3aNo',
        timestamp: new Date('2025-02-15'),
        plant_cycle_id: cycle2025.id,
    }
  ];

  for (const logData of journal_entries) {
    await prisma.journalEntry.create({ data: logData });
  }

  // 5. Create Dynamic Tasks
  const tasks = [
    {
      plant_id: plant.id,
      type: TaskType.WATER,
      title: 'Deep Root Hydration',
      category: TaskCategory.WATERING,
      priority: TaskPriority.HIGH,
      source: TaskSource.SEASONAL_PACK,
      reason: 'Malda variety requires consistent deep watering during fruit development to ensure the signature sweetness.',
      due_date: new Date(),
    },
    {
      plant_id: plant.id,
      type: TaskType.INSPECT,
      title: 'Hopper Surveillance',
      category: TaskCategory.INSPECTION,
      priority: TaskPriority.MEDIUM,
      source: TaskSource.SYSTEM,
      reason: 'Ambient temperature in Patna is rising, increasing Hopper risk.',
      due_date: new Date(Date.now() + 86400000), 
    }
  ];

  for (const taskData of tasks) {
    await prisma.task.create({ data: taskData });
  }

  console.log('✨ Malda data population complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
