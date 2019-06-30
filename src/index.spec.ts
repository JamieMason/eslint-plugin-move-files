import api = require('.');

it('should match the ESLint API', () => {
  expect(api).toEqual({
    rules: {
      'move-files': {
        meta: expect.any(Object),
        create: expect.any(Function)
      }
    },
    rulesConfig: {
      'move-files': expect.any(Array)
    }
  });
});
