import { Test, TestingModule } from '@nestjs/testing';
import { TreeLedgerService } from './tree-ledger.service';

describe('TreeLedgerService', () => {
  let service: TreeLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TreeLedgerService],
    }).compile();

    service = module.get<TreeLedgerService>(TreeLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
