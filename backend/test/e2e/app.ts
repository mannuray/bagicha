import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

export type ModuleOverrides = (
  builder: TestingModuleBuilder,
) => TestingModuleBuilder;

/** Boots the real AppModule with the same global wiring as main.ts. */
export async function createTestApp(
  overrides?: ModuleOverrides,
): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (overrides) builder = overrides(builder);
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication({ bodyParser: false });
  configureApp(app);
  await app.init();
  return app;
}
