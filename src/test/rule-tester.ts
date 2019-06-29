import { RuleTester } from 'eslint';

function wrapper(this: any, text: string, method: () => void) {
  return method.call(this);
}

(RuleTester as any).describe = wrapper;

(RuleTester as any).it = wrapper;

export const ruleTester = new RuleTester({
  parserOptions: {
    ecmaFeatures: { jsx: false },
    ecmaVersion: 8,
    sourceType: 'module'
  }
});
