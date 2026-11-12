import { validationField } from './validation-field';

describe('validationField', () => {
  it('reads the field a class-validator message is about', () => {
    expect(validationField('name must be a string')).toBe('name');
    expect(validationField('property nmae should not exist')).toBe('nmae');
    expect(
      validationField(
        'each value in types must be one of the following values: NOTE',
      ),
    ).toBe('types');
    expect(
      validationField(
        'garden_types.0 must be one of the following values: trees',
      ),
    ).toBe('garden_types.0');
    expect(validationField('')).toBe('unknown');
  });
});
