import golden from './__fixtures__/golden.json';
import { MITIGATION_FIXTURES } from './__fixtures__/inputs';
import { MitigationInput, MitigationPlanner } from './mitigation-planner';

describe('MitigationPlanner (golden: identical to the pre-refactor service)', () => {
  const planner = new MitigationPlanner();

  it.each(Object.keys(MITIGATION_FIXTURES))('%s history', (name) => {
    const input = MITIGATION_FIXTURES[name] as unknown as MitigationInput;
    const plan = planner.plan(input);
    expect(plan).toMatchObject(
      (golden.mitigation as Record<string, object>)[name],
    );
  });

  it('counts the latest cycle tasks by status', () => {
    const plan = planner.plan(
      MITIGATION_FIXTURES.heavyDropWithPests as unknown as MitigationInput,
    );
    expect(plan).toMatchObject({
      cycle_year: 2026,
      completed_tasks: 1,
      skipped_tasks: 1,
      pending_tasks: 1,
    });
  });
});
