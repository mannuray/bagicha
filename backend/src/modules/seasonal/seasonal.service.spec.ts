import { Test, TestingModule } from '@nestjs/testing';
import { SeasonalService } from './seasonal.service';

describe('SeasonalService', () => {
  let service: SeasonalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeasonalService],
    }).compile();

    service = module.get<SeasonalService>(SeasonalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
