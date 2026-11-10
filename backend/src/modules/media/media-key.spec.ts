import { parseMediaKey } from './media.config';

const FILE = '3f2c9a1e-7b4d-4c2a-9e1f-0a1b2c3d4e5f.jpg';

describe('parseMediaKey', () => {
  it('parses a well-formed private key', () => {
    expect(parseMediaKey(`vision/u1/${FILE}`)).toEqual({
      kind: 'vision',
      ownerId: 'u1',
      file: FILE,
    });
  });

  it('maps the posts prefix to the post kind', () => {
    expect(parseMediaKey(`posts/u1/${FILE}`)?.kind).toBe('post');
  });

  it.each([
    [`vision/u1/../u2/${FILE}`],
    [`vision//${FILE}`],
    ['vision/u1'],
    [`unknown/u1/${FILE}`],
    [`vision/u1/${FILE}/extra`],
    [`vision%2Fu2%2F${FILE}`],
    [`vision/..%2Fu2/${FILE}`],
    [`vision/u1/not-a-uuid.jpg`],
    [''],
  ])('rejects %p', (key) => {
    expect(parseMediaKey(key)).toBeNull();
  });
});
