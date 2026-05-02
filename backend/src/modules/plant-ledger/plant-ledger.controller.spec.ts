import { Test, TestingModule } from '@nestjs/testing';
import { PlantLedgerController } from './plant-ledger.controller';

describe('PlantLedgerController', () => {
  let controller: PlantLedgerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantLedgerController],
    }).compile();

    controller = module.get<PlantLedgerController>(PlantLedgerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
