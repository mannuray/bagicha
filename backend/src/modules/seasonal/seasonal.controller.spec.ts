import { Test, TestingModule } from '@nestjs/testing';
import { SeasonalController } from './seasonal.controller';

describe('SeasonalController', () => {
  let controller: SeasonalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeasonalController],
    }).compile();

    controller = module.get<SeasonalController>(SeasonalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
