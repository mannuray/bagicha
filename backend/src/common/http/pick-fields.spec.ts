import { pickFields } from './pick-fields';

describe('pickFields', () => {
  it('copies only the listed fields, skipping ones the row lacks', () => {
    const row = { id: '1', name: 'Aam', user_id: 'u1', secret: 'x' } as {
      id: string;
      name: string;
      user_id: string;
      secret: string;
      extra?: number;
    };
    expect(pickFields(row, ['id', 'name', 'extra'])).toEqual({
      id: '1',
      name: 'Aam',
    });
  });
});
