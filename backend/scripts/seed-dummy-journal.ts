import { PrismaClient, LogType } from '@prisma/client';

const prisma = new PrismaClient();

const PHONE = '+916202042225';
const TREE_NAME = 'Malda';

async function main() {
  const user = await prisma.user.findUnique({ where: { phone_number: PHONE } });
  if (!user) {
    throw new Error(`No user found for ${PHONE}. Run populate-mock-data.ts first.`);
  }

  const plant = await prisma.plant.findFirst({
    where: { user_id: user.id, name: TREE_NAME },
  });
  if (!plant) {
    throw new Error(`No plant named "${TREE_NAME}" for that user.`);
  }

  const existingCount = await prisma.journalEntry.count({ where: { plant_id: plant.id } });
  console.log(`📓 Plant "${plant.name}" currently has ${existingCount} log(s).`);

  const photoUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBVH-U7sXysGDYsa6cual1c1DqJ8furKsz8F4R2g0No_WnTP7DOhTD5cJuk8zeDxk_d50PDZ-8sBi_g4ZpFV8EwRoF7FlW4Fe9DIyXa0O4QKxuvD3ylC55FYRkON-zat6w5J4cOhfjnEOWAaYm1pFy_dfykFOgt0lZ6eMMPVKsPFH7WYTr1MFCz_p8bP8cdiwkBevCvzuBr4E19GAtF_0mr1w-FLf8g3fbLKTGPQW2Gl-vYYdCa-agAGiq_c6DFqh_fU7HvsiE3aNo';

  const journal_entries: Array<{ type: LogType; content: string; timestamp: Date; metadata?: any }> = [
    {
      type: LogType.PLANTING,
      content: 'Planted Malda graft along the south wall. Soil enriched with vermicompost.',
      timestamp: new Date('2024-07-15'),
    },
    {
      type: LogType.WATERING,
      content: 'Deep watering after the dry spell. Soil moisture restored.',
      timestamp: new Date('2024-08-22'),
    },
    {
      type: LogType.FEEDING,
      content: 'Applied neem cake and rock phosphate around the drip line.',
      timestamp: new Date('2024-09-10'),
      metadata: { feeding_type: 'organic' },
    },
    {
      type: LogType.PRUNING,
      content: 'Light formative pruning to open up the canopy center.',
      timestamp: new Date('2024-12-05'),
      metadata: { pruning_type: 'formative' },
    },
    {
      type: LogType.PHOTO,
      content: photoUrl,
      timestamp: new Date('2025-01-20'),
    },
    {
      type: LogType.FLOWERING,
      content: 'First panicles spotted on the south-facing branches.',
      timestamp: new Date('2026-02-18'),
    },
    {
      type: LogType.PEST_DIAGNOSIS,
      content: 'Mango hopper sighting on new growth. Sticky honeydew visible.',
      timestamp: new Date('2026-03-04'),
      metadata: { severity: 'MEDIUM', pest_type: 'Mango Hopper' },
    },
    {
      type: LogType.TREATMENT,
      content: 'Sprayed neem oil emulsion at dusk. Two-week follow-up planned.',
      timestamp: new Date('2026-03-06'),
    },
    {
      type: LogType.NOTE,
      content: 'Noticed bee activity around the panicles — pollination looks healthy.',
      timestamp: new Date('2026-03-22'),
    },
    {
      type: LogType.FRUIT_SET,
      content: 'Pea-sized fruits forming on three main branches.',
      timestamp: new Date('2026-04-08'),
      metadata: { fruit_set_strength: 'MEDIUM' },
    },
  ];

  for (const log of journal_entries) {
    await prisma.journalEntry.create({
      data: {
        plant_id: plant.id,
        type: log.type,
        content: log.content,
        timestamp: log.timestamp,
        metadata: log.metadata ?? undefined,
      },
    });
  }

  const newCount = await prisma.journalEntry.count({ where: { plant_id: plant.id } });
  console.log(`✨ Added ${journal_entries.length} dummy journal records. Plant now has ${newCount} log(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
