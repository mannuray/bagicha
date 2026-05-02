import { Test, TestingModule } from '@nestjs/testing';
import { PlantLedgerService } from './plant-ledger.service';

describe('PlantLedgerService', () => {
  let service: PlantLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlantLedgerService],
    }).compile();

    service = module.get<PlantLedgerService>(PlantLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
