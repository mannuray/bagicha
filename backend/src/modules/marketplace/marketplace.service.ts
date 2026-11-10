import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectPinoLogger(MarketplaceService.name)
    private readonly logger: PinoLogger,
  ) {}

  getItems() {
    // For MVP, returning a static list of items
    return [
      {
        id: 'item_1',
        name: 'Langra Mango Sapling',
        category: 'ORCHARD',
        price: 499,
        description: 'Verified high-yield variety from Bihar.',
      },
      {
        id: 'item_2',
        name: 'Professional Pruning Shears',
        category: 'TOOLS',
        price: 1299,
        description: 'Stainless steel blades for clean cuts.',
      },
      {
        id: 'item_3',
        name: 'Organic Neem Pesticide',
        category: 'CARE',
        price: 250,
        description: 'Effective against mealybugs and aphids.',
      },
    ];
  }

  buyItem(userId: string, itemId: string) {
    this.logger.info({ userId, itemId }, 'Mock marketplace purchase');

    // Logic to trigger delivery or add to ledger
    return {
      success: true,
      delivery_estimate: '3-5 business days',
    };
  }
}
