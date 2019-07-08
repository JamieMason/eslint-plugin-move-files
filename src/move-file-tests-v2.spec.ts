import { lintAndFix, lintOnly, TestCase } from './test/runner';

const movementMessage = (nodeType: string, from: string, to: string) =>
  expect.objectContaining({ message: `${from} has moved to ${to}`, nodeType });

it('should rename a file in-place', async () => {
  const testCase: TestCase = {
    files: [
      [['./src/rename-me.js', './src/renamed.js'], [['../main']]],
      [['./src/consumer.js'], [['./rename-me', './renamed']]],
      [['./src/unaffected.js'], [['./lib']]]
    ],
    options: { files: { './src/rename-me.js': './renamed.js' } }
  };

  const fix = await lintAndFix(testCase);
  expect(fix.diskContents.actual).toEqual(fix.diskContents.expected);
  expect(fix.messages['./src/rename-me.js']).toEqual([
    movementMessage('Program', './src/rename-me.js', './src/renamed.js')
  ]);
  expect(fix.messages['./src/consumer.js']).toEqual([]);
  expect(fix.messages['./src/unaffected.js']).toEqual([]);

  const lint = await lintOnly(testCase);
  console.log(JSON.stringify(lint, null, 2));
  expect(lint.diskContents.actual).toEqual(lint.diskContents.expected);
  expect(lint.messages['./src/rename-me.js']).toEqual([
    movementMessage('Program', './src/rename-me.js', './src/renamed.js')
  ]);
  expect(lint.messages['./src/consumer.js']).toEqual([
    movementMessage('Literal', './src/rename-me.js', './src/renamed.js')
  ]);
});
