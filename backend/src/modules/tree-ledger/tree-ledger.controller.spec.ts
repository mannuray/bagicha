import { Test, TestingModule } from '@nestjs/testing';
import { TreeLedgerController } from './tree-ledger.controller';

describe('TreeLedgerController', () => {
  let controller: TreeLedgerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreeLedgerController],
    }).compile();

    controller = module.get<TreeLedgerController>(TreeLedgerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
